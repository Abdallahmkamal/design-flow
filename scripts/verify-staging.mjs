const phaseFourMarkers = ['Log work', 'Work Dates', 'Correct work log'];

function requiredEnvironment(name, source = process.env) {
  const value = source[name]?.trim();

  if (!value) {
    throw new Error(`Missing required staging environment: ${name}`);
  }

  return value;
}

function assertHttpsUrl(name, value) {
  const url = new URL(value);

  if (url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS.`);
  }

  return url;
}

export function moduleScriptSource(html) {
  const match = html.match(
    /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["'][^>]*>/u,
  );

  if (!match?.[1]) {
    throw new Error('The staging page does not contain a module script.');
  }

  return match[1];
}

export function linkedJavaScriptSources(bundle) {
  return [
    ...new Set(
      [...bundle.matchAll(/(?:\.\/|\/)?(?:assets\/)?[\w.-]+\.js/gu)].map(
        (match) => match[0],
      ),
    ),
  ].slice(0, 20);
}

async function responseText(fetcher, url, init, label) {
  const response = await fetcher(url, init);

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }

  return { response, text: await response.text() };
}

export async function verifyStaging({
  environment = process.env,
  fetcher = fetch,
} = {}) {
  const appUrl = assertHttpsUrl(
    'STAGING_APP_URL',
    requiredEnvironment('STAGING_APP_URL', environment),
  );
  const supabaseUrl = assertHttpsUrl(
    'VITE_SUPABASE_URL',
    requiredEnvironment('VITE_SUPABASE_URL', environment),
  );
  const publishableKey = requiredEnvironment(
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    environment,
  );
  const headers = {
    apikey: publishableKey,
  };
  const checks = [];

  const { text: html } = await responseText(
    fetcher,
    appUrl,
    undefined,
    'Staging frontend',
  );

  if (!html.includes('<title>Design Flow</title>')) {
    throw new Error('The staging frontend returned an unexpected document.');
  }

  const bundleUrl = new URL(moduleScriptSource(html), appUrl);

  if (bundleUrl.origin !== appUrl.origin) {
    throw new Error('The staging module script must be served by Pages.');
  }

  const { text: bundle } = await responseText(
    fetcher,
    bundleUrl,
    undefined,
    'Staging application bundle',
  );
  const linkedBundles = await Promise.all(
    linkedJavaScriptSources(bundle).map(async (source) => {
      const baseUrl =
        source.startsWith('/') || source.startsWith('assets/')
          ? appUrl
          : bundleUrl;
      const linkedUrl = new URL(source, baseUrl);

      if (linkedUrl.origin !== appUrl.origin) {
        throw new Error(
          'A staging JavaScript chunk used an unexpected origin.',
        );
      }

      return (
        await responseText(
          fetcher,
          linkedUrl,
          undefined,
          'Staging JavaScript chunk',
        )
      ).text;
    }),
  );
  const deployedJavaScript = [bundle, ...linkedBundles].join('\n');
  const missingMarker = phaseFourMarkers.find(
    (marker) => !deployedJavaScript.includes(marker),
  );

  if (missingMarker) {
    throw new Error(
      `The live bundle is missing the Phase 4 marker: ${missingMarker}`,
    );
  }

  checks.push('Phase 4 frontend bundle');

  await responseText(
    fetcher,
    new URL('/auth/v1/health', supabaseUrl),
    { headers },
    'Supabase Auth health',
  );
  checks.push('Supabase Auth health');

  const profileResponse = await fetcher(
    new URL('/rest/v1/profiles?select=id&limit=1', supabaseUrl),
    { headers },
  );

  if (profileResponse.ok) {
    const profiles = JSON.parse(await profileResponse.text());

    if (!Array.isArray(profiles) || profiles.length !== 0) {
      throw new Error('Anonymous staging access exposed profile records.');
    }
  } else if (![401, 403].includes(profileResponse.status)) {
    throw new Error(
      `Anonymous profile boundary returned HTTP ${profileResponse.status}.`,
    );
  }

  checks.push('anonymous profile denial');

  const { response: functionResponse, text: functionPayload } =
    await responseText(
      fetcher,
      new URL('/functions/v1/change_own_password', supabaseUrl),
      {
        method: 'OPTIONS',
        headers: {
          ...headers,
          origin: appUrl.origin,
        },
      },
      'Edge Function CORS smoke check',
    );

  if (
    functionResponse.headers.get('access-control-allow-origin') !==
    appUrl.origin
  ) {
    throw new Error('The Edge Function staging origin is not allowed.');
  }

  const functionResult = JSON.parse(functionPayload);

  if (functionResult.ok !== true) {
    throw new Error('The Edge Function CORS smoke check was not acknowledged.');
  }

  checks.push('Edge Function origin');

  console.log(`Staging smoke checks passed: ${checks.join(', ')}.`);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  await verifyStaging();
}
