import { createRuntimeDependencies } from '../_shared/runtime.ts';
import { createChangeOwnPasswordHandler } from './handler.ts';

const runtime = createRuntimeDependencies();

export default { fetch: createChangeOwnPasswordHandler(runtime) };
