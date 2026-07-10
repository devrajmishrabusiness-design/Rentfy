import type { PlatformEventType } from './event';
export interface Subscription {
    readonly id: string;
    readonly type: PlatformEventType;
    unsubscribe(): void;
}
export type Unsubscribe = () => void;
//# sourceMappingURL=subscription.d.ts.map