/**
 * Pending-action queue for renter email authentication.
 *
 * When a user clicks "Contact Agency" or "Save" without being signed in,
 * the component writes a `pendingAction` to localStorage, opens the auth
 * dialog, and lets the user sign in. After authentication, the
 * RenterSessionProvider consumes the pendingAction and re-fires the
 * original handler.
 *
 * Why localStorage and not React state:
 *   - The auth dialog is mounted at the layout level, but the action that
 *     triggered it lived on a deeper component. After verify, that
 *     component may unmount/remount as the URL stays the same and
 *     React re-renders. localStorage survives that.
 *   - The user may close/reopen the tab. TTL of 1 hour keeps stale
 *     actions from being re-fired.
 *
 * SSR safety: every entry point guards `typeof window`.
 */

const KEY = "rentereasy.renter.pendingAction.v1";
const TTL_MS = 60 * 60 * 1000; // 1 hour

export type PendingAction =
  | {
      kind: "contact";
      propertyId: string;
      agencyId: string;
      source: "whatsapp" | "contact";
      createdAt: number;
    }
  | {
      kind: "favorite";
      propertyId: string;
      next: "add" | "remove";
      createdAt: number;
    }
  | {
      kind: "visit";
      propertyId: string;
      agencyId: string;
      createdAt: number;
    };

export type PendingActionInput =
  | Omit<Extract<PendingAction, { kind: "contact" }>, "createdAt">
  | Omit<Extract<PendingAction, { kind: "favorite" }>, "createdAt">
  | Omit<Extract<PendingAction, { kind: "visit" }>, "createdAt">;

export function setPendingAction(action: PendingActionInput) {
  if (typeof window === "undefined") return;
  const payload: PendingAction = { ...action, createdAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode quota, etc.).
    // Failing silently is acceptable — the user will need to re-click.
  }
}

export function consumePendingAction(): PendingAction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    window.localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PendingAction;
    if (!parsed || typeof parsed.createdAt !== "number") return null;
    if (Date.now() - parsed.createdAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAction() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
