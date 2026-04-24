export type OrderStage =
    | 'confirmed'
    | 'processing'
    | 'ready'
    | 'dispatched'
    | 'installed'
    | 'on_hold'
    | 'cancelled';

export const ORDER_STAGES: OrderStage[] = [
    'confirmed',
    'processing',
    'ready',
    'dispatched',
    'installed',
    'on_hold',
    'cancelled',
];

/** The linear progression stages, in order, for the stepper. */
export const STEPPER_STAGES: OrderStage[] = [
    'confirmed',
    'processing',
    'ready',
    'dispatched',
    'installed',
];

const LABELS: Record<OrderStage, string> = {
    confirmed: 'Confirmed',
    processing: 'Processing',
    ready: 'Ready',
    dispatched: 'Dispatched',
    installed: 'Installed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
};

export function stageLabel(s: OrderStage): string {
    return LABELS[s];
}

export function stageIndex(s: OrderStage): number {
    return STEPPER_STAGES.indexOf(s);
}

export function isTerminal(s: OrderStage): boolean {
    return s === 'installed' || s === 'cancelled';
}

export function canCancel(s: OrderStage): boolean {
    return !isTerminal(s) && s !== 'dispatched';
}

export function canCreateDispatch(s: OrderStage): boolean {
    return s === 'ready' || s === 'processing';
}

export function canRaiseInvoice(s: OrderStage): boolean {
    return s === 'dispatched' || s === 'ready' || s === 'installed';
}

/** Can user move to the next stepper stage? */
export function canAdvanceTo(current: OrderStage, target: OrderStage): boolean {
    const c = stageIndex(current);
    const t = stageIndex(target);
    if (c < 0 || t < 0) return false;
    return t === c + 1;
}
