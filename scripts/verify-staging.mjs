const checkpointMarkers = [
  'Operational overview',
  'Personal inbox',
  'Activity history',
  'Standalone Visual Work',
];
const maximumLinkedJavaScriptSources = 64;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function requiredEnvironment(name, source = process.env) {
  const value = source[name]?.trim();

  if (!value) {
    throw new Error(`Missing required deployment environment: ${name}`);
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
    throw new Error('The deployed page does not contain a module script.');
  }

  return match[1];
}

export function assertSecurityHeaders(response) {
  const contentSecurityPolicy = response.headers.get('content-security-policy');
  const requiredDirectives = [
    "default-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
  ];

  if (
    !contentSecurityPolicy ||
    requiredDirectives.some(
      (directive) => !contentSecurityPolicy.includes(directive),
    )
  ) {
    throw new Error('The deployed frontend is missing its required CSP.');
  }
  if (response.headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error('The deployed frontend is missing nosniff.');
  }
  if (response.headers.get('referrer-policy') !== 'no-referrer') {
    throw new Error('The deployed frontend has an unsafe referrer policy.');
  }
  if (!response.headers.get('permissions-policy')?.includes('camera=()')) {
    throw new Error('The deployed frontend is missing its permissions policy.');
  }
}

export function linkedJavaScriptSources(bundle) {
  return [
    ...new Set(
      [...bundle.matchAll(/(?:\.\/|\/)?(?:assets\/)?[\w.-]+\.js/gu)].map(
        (match) => match[0],
      ),
    ),
  ].slice(0, maximumLinkedJavaScriptSources);
}

async function responseText(fetcher, url, init, label) {
  const response = await fetcher(url, init);

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }

  return { response, text: await response.text() };
}

async function deployedFrontendJavaScript(fetcher, appUrl) {
  const { response, text: html } = await responseText(
    fetcher,
    appUrl,
    undefined,
    'Deployed frontend',
  );
  assertSecurityHeaders(response);

  if (!html.includes('<title>Design Flow</title>')) {
    throw new Error('The deployed frontend returned an unexpected document.');
  }

  const bundleUrl = new URL(moduleScriptSource(html), appUrl);

  if (bundleUrl.origin !== appUrl.origin) {
    throw new Error('The deployed module script must be served by Pages.');
  }

  const { text: bundle } = await responseText(
    fetcher,
    bundleUrl,
    undefined,
    'Deployed application bundle',
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
          'A deployed JavaScript chunk used an unexpected origin.',
        );
      }

      return (
        await responseText(
          fetcher,
          linkedUrl,
          undefined,
          'Deployed JavaScript chunk',
        )
      ).text;
    }),
  );

  return [bundle, ...linkedBundles].join('\n');
}

function deploymentConfiguration(environment) {
  const appUrlValue =
    environment.DEPLOYMENT_APP_URL?.trim() ||
    environment.STAGING_APP_URL?.trim();
  if (!appUrlValue) {
    throw new Error(
      'Missing required deployment environment: DEPLOYMENT_APP_URL',
    );
  }

  return {
    appUrl: assertHttpsUrl('DEPLOYMENT_APP_URL', appUrlValue),
    expectedAppEnvironment: requiredEnvironment(
      'EXPECTED_APP_ENV',
      environment,
    ),
    supabaseUrl: assertHttpsUrl(
      'VITE_SUPABASE_URL',
      requiredEnvironment('VITE_SUPABASE_URL', environment),
    ),
    publishableKey: requiredEnvironment(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      environment,
    ),
  };
}

export async function verifyBackend({
  environment = process.env,
  fetcher = fetch,
} = {}) {
  const { appUrl, publishableKey, supabaseUrl } =
    deploymentConfiguration(environment);
  const headers = { apikey: publishableKey };
  const checks = [];

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
      throw new Error('Anonymous deployment access exposed profile records.');
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
    throw new Error('The Edge Function deployment origin is not allowed.');
  }

  const functionResult = JSON.parse(functionPayload);
  if (functionResult.ok !== true) {
    throw new Error('The Edge Function CORS smoke check was not acknowledged.');
  }
  checks.push('Edge Function origin');

  console.log(`Backend smoke checks passed: ${checks.join(', ')}.`);
}

export async function verifyStaging({
  environment = process.env,
  fetcher = fetch,
  frontendAttempts = 6,
  retryDelayMs = 10_000,
  waiter = wait,
} = {}) {
  const { appUrl, expectedAppEnvironment } =
    deploymentConfiguration(environment);
  const checks = [];

  for (let attempt = 1; attempt <= frontendAttempts; attempt += 1) {
    try {
      const deployedJavaScript = await deployedFrontendJavaScript(
        fetcher,
        appUrl,
      );
      const missingMarker = checkpointMarkers.find(
        (marker) => !deployedJavaScript.includes(marker),
      );

      if (missingMarker) {
        throw new Error(
          `The live bundle is missing the required marker: ${missingMarker}`,
        );
      }

      const documentResponse = await responseText(
        fetcher,
        appUrl,
        undefined,
        'Deployed environment marker',
      );
      const environmentPattern = new RegExp(
        `<meta[^>]+name=["']design-flow-environment["'][^>]+content=["']${expectedAppEnvironment}["']`,
        'u',
      );
      if (!environmentPattern.test(documentResponse.text)) {
        throw new Error(
          'The deployed frontend environment marker is incorrect.',
        );
      }

      break;
    } catch (error) {
      if (attempt === frontendAttempts) throw error;
    }

    await waiter(retryDelayMs);
  }

  checks.push('complete frontend bundle and environment');

  await verifyBackend({ environment, fetcher });
  checks.push('backend boundaries');

  console.log(`Deployment smoke checks passed: ${checks.join(', ')}.`);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  await verifyStaging();
}
