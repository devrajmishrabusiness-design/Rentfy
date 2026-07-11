import type { ActionExecutor, ActionDefinition, ActionContext } from '../interfaces/actions';
export declare class DefaultActionExecutor implements ActionExecutor {
    execute(action: ActionDefinition, context: ActionContext): Promise<void>;
}
//# sourceMappingURL=default-executor.d.ts.map