import type { EngineEvent, EngineEventHandler, EventBus } from '../types';
export declare class DefaultEventBus implements EventBus {
    private handlers;
    private onceHandlers;
    on(event: string, handler: EngineEventHandler): void;
    off(event: string, handler: EngineEventHandler): void;
    emit(event: EngineEvent): void;
    once(event: string, handler: EngineEventHandler): void;
    clear(): void;
    getHandlerCount(event: string): number;
    hasHandlers(event: string): boolean;
}
//# sourceMappingURL=event-bus.d.ts.map