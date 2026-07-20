import { createRuntimeDependencies } from '../_shared/runtime.ts';
import { createTemporaryPasswordResetHandler } from './handler.ts';

const runtime = createRuntimeDependencies();

export default { fetch: createTemporaryPasswordResetHandler(runtime) };
