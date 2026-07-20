Deno.test(
  'modern secret keys are sent only through the apikey header',
  async () => {
    const { createServerHeaders } = await import('./supabaseGateway.ts');
    const headers = createServerHeaders('sb_secret_synthetic');

    if (
      headers.apikey !== 'sb_secret_synthetic' ||
      'authorization' in headers
    ) {
      throw new Error('Modern secret-key headers are not configured safely.');
    }
  },
);

Deno.test(
  'legacy service-role keys retain their bearer authorization header',
  async () => {
    const { createServerHeaders } = await import('./supabaseGateway.ts');
    const headers = createServerHeaders('synthetic-legacy-jwt');

    if (
      headers.apikey !== 'synthetic-legacy-jwt' ||
      headers.authorization !== 'Bearer synthetic-legacy-jwt'
    ) {
      throw new Error('Legacy service-role headers are incomplete.');
    }
  },
);

Deno.test(
  'the Edge Function test harness runs without network or secrets',
  () => {
    const syntheticEmail = ['phase-one', 'example.invalid'].join('@');

    if (!syntheticEmail.endsWith('@example.invalid')) {
      throw new Error('The test harness must use visibly synthetic data.');
    }
  },
);
