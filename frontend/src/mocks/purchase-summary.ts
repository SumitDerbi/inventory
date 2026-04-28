import { purchaseRequisitions, prTotal } from './purchase-requisitions';
import { purchaseOrders, poTotals, type PurchaseOrder } from './purchase-orders';
import { grns } from './grns';
import { vendorInvoices, invoiceOutstanding } from './vendor-invoices';
import { vendorPayments } from './vendor-payments';

export interface PurchaseSummary {
    openPRs: number;
    openPOValue: number;
    grnPending: number;
    invoiceMismatch: number;
    outstandingPayable: number;
    paymentsThisWeek: number;
}

export function purchaseSummary(): PurchaseSummary {
    const openPRs = purchaseRequisitions.filter((p) =>
        ['draft', 'submitted', 'approved', 'rfq_issued'].includes(p.status),
    ).length;
    const openPOValue = purchaseOrders
        .filter((p) =>
            ['approved', 'sent', 'partially_received'].includes(p.stage),
        )
        .reduce((s, p) => s + poTotals(p).grandTotalBaseCurrency, 0);
    const grnPending = grns.filter((g) =>
        ['received', 'qc_pending', 'qc_complete'].includes(g.stage),
    ).length;
    const invoiceMismatch = vendorInvoices.filter(
        (v) => v.status === 'mismatch',
    ).length;
    const outstandingPayable = vendorInvoices.reduce(
        (s, v) => s + invoiceOutstanding(v),
        0,
    );
    const weekAgo = Date.now() - 7 * 86_400_000;
    const paymentsThisWeek = vendorPayments
        .filter(
            (p) => p.status === 'cleared' && new Date(p.paymentDate).getTime() >= weekAgo,
        )
        .reduce((s, p) => s + p.amount, 0);
    return {
        openPRs,
        openPOValue,
        grnPending,
        invoiceMismatch,
        outstandingPayable,
        paymentsThisWeek,
    };
}

export { prTotal };
export type { PurchaseOrder };
