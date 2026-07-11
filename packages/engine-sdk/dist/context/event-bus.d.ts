import type { EngineEvent, EngineEventHandler, EventBus } from '../types';
export declare class DefaultEventBus implements EventBus {
    private readonly bus;
    private readonly handlerSubs;
    on(event: string, handler: EngineEventHandler): void;
    off(event: string, handler: EngineEventHandler): void;
    emit(event: EngineEvent): void;
    once(event: string, handler: EngineEventHandler): void;
    clear(): void;
    getHandlerCount(event: string): number;
    hasHandlers(event: string): boolean;
    private trackSub;
}
//# sourceMappingURL=event-bus.d.ts.map