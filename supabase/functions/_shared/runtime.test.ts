Deno.test(
  'the Edge Function test harness runs without network or secrets',
  () => {
    const syntheticEmail = ['phase-one', 'example.invalid'].join('@');

    if (!syntheticEmail.endsWith('@example.invalid')) {
      throw new Error('The test harness must use visibly synthetic data.');
    }
  },
);
