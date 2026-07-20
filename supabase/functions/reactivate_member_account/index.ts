import { createRuntimeDependencies } from '../_shared/runtime.ts';
import { createReactivateMemberHandler } from './handler.ts';

const runtime = createRuntimeDependencies();

export default { fetch: createReactivateMemberHandler(runtime) };
