/**
 * IPC Module Exports
 */

export {
  registerHandler,
  registerHandlers,
  unregisterHandler,
  unregisterAllHandlers,
  broadcastEvent,
  sendEvent,
  createError,
  createSuccess,
  isIpcResponse,
  createPlaceholderHandler,
  registerPlaceholderHandlers,
} from './handlers';

export type { IpcHandlerFn, IpcHandlerDefinition } from './handlers';
