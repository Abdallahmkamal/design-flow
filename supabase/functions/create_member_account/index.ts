import { createRuntimeDependencies } from '../_shared/runtime.ts';
import { createMemberAccountHandler } from './handler.ts';

const runtime = createRuntimeDependencies();

export default { fetch: createMemberAccountHandler(runtime) };
