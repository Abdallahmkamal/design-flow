import { createMemoryRateLimiter } from '../_shared/security.ts';
import {
  createRuntimeDependencies,
  requiredEnvironment,
} from '../_shared/runtime.ts';
import { createBootstrapFirstAdminHandler } from './handler.ts';

const runtime = createRuntimeDependencies();
const handler = createBootstrapFirstAdminHandler({
  ...runtime,
  bootstrapSecret: requiredEnvironment('DESIGN_FLOW_BOOTSTRAP_SECRET'),
  bootstrapEmail: requiredEnvironment('DESIGN_FLOW_BOOTSTRAP_EMAIL'),
  rateLimiter: createMemoryRateLimiter(),
});

export default { fetch: handler };
