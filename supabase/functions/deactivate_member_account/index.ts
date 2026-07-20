import { createRuntimeDependencies } from '../_shared/runtime.ts';
import { createDeactivateMemberHandler } from './handler.ts';

const runtime = createRuntimeDependencies();

export default { fetch: createDeactivateMemberHandler(runtime) };
