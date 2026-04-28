import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { customers } from '@/mocks/customers';
import { orderById, orders as allOrders } from '@/mocks/orders';
import {
    createCustomerInvoice,
    type CustomerInvoice,
    type CustomerInvoiceLine,
} from '@/mocks/customer-invoices';

export type CustomerInvoiceFormMode =
    | { kind: 'from-so'; orderId: string }
    | { kind: 'standalone' };

export interface CustomerInvoiceFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: CustomerInvoiceFormMode;
    onCreated?: (invoice: CustomerInvoice) => void;
}

function emptyLine(idx: number): CustomerInvoiceLine {
    return {
        id: `tmp-line-${idx}`,
        description: '',
        hsn: '8413',
        quantity: 1,
        uom: 'nos',
        unitPrice: 0,
        discountPct: 0,
        taxRate: 18,
    };
}

export function CustomerInvoiceForm({ open, onOpenChange, mode, onCreated }: CustomerInvoiceFormProps) {
    const toast = useToast();

    const so = mode.kind === 'from-so' ? orderById(mode.orderId) : undefined;
    const [customerId, setCustomerId] = useState<string>(() => {
        if (mode.kind === 'from-so' && so) {
            const c = customers.find((cu) => cu.legalName === so.companyName || cu.name === so.companyName);
            return c?.id ?? customers[0].id;
        }
        return customers[0].id;
    });
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
    });
    const [placeOfSupply, setPlaceOfSupply] = useState('Gujarat');
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [notes, setNotes] = useState('');

    const [lines, setLines] = useState<CustomerInvoiceLine[]>(() => {
        if (mode.kind === 'from-so' && so) {
            return so.items.map((it, i) => ({
                id: `tmp-line-${i}`,
                description: it.description,
                hsn: '8413',
                quantity: it.orderedQty - it.dispatchedQty > 0 ? it.orderedQty - it.dispatchedQty : it.orderedQty,
                uom: it.uom,
                unitPrice: it.netPrice,
                discountPct: 0,
                taxRate: it.taxRate,
            }));
        }
        return [emptyLine(0)];
    });

    function updateLine(idx: number, patch: Partial<CustomerInvoiceLine>) {
        setLines((curr) => curr.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    }
    function removeLine(idx: number) {
        setLines((curr) => curr.filter((_, i) => i !== idx));
    }
    function addLine() {
        setLines((curr) => [...curr, emptyLine(curr.length)]);
    }

    function preview() {
        let subtotal = 0;
        let taxable = 0;
        let totalTax = 0;
        for (const l of lines) {
            const gross = l.quantity * l.unitPrice;
            const disc = (gross * l.discountPct) / 100;
            const t = gross - disc;
            subtotal += gross;
            taxable += t;
            totalTax += (t * l.taxRate) / 100;
        }
        return { subtotal, taxable, totalTax, grandTotal: Math.round(taxable + totalTax) };
    }

    function submit() {
        if (lines.length === 0 || lines.some((l) => !l.description || l.quantity <= 0 || l.unitPrice <= 0)) {
            toast.push({ title: 'Each line needs a description, qty and price.', variant: 'error' });
            return;
        }
        const customer = customers.find((c) => c.id === customerId)!;
        const intraState = placeOfSupply.toLowerCase() === 'gujarat';
        const totals = preview();
        const cgst = intraState ? totals.totalTax / 2 : 0;
        const sgst = intraState ? totals.totalTax / 2 : 0;
        const igst = intraState ? 0 : totals.totalTax;

        const inv = createCustomerInvoice({
            invoiceNumber: `INV-2026-${Math.floor(Math.random() * 900 + 100)}`,
            customerId: customer.id,
            customerName: customer.legalName ?? customer.name,
            salesOrderId: mode.kind === 'from-so' ? mode.orderId : null,
            salesOrderNumber: mode.kind === 'from-so' ? so?.orderNumber ?? null : null,
            invoiceDate: new Date(invoiceDate).toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            placeOfSupply,
            currency: 'INR',
            lineItems: lines.map((l, i) => ({ ...l, id: `line-${i + 1}` })),
            subtotal: Math.round(totals.subtotal),
            discount: Math.round(totals.subtotal - totals.taxable),
            taxableValue: Math.round(totals.taxable),
            cgst: Math.round(cgst),
            sgst: Math.round(sgst),
            igst: Math.round(igst),
            freight: 0,
            roundOff: 0,
            grandTotal: totals.grandTotal,
            paidAmount: 0,
            balance: totals.grandTotal,
            status: 'draft',
            paymentTerms,
            notes: notes || undefined,
            payments: [],
        });
        toast.push({ title: `Invoice ${inv.invoiceNumber} created`, variant: 'success' });
        onCreated?.(inv);
        onOpenChange(false);
    }

    const totals = preview();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode.kind === 'from-so' ? `Raise invoice from ${so?.orderNumber ?? '—'}` : 'New customer invoice'}
                    </DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <div className="grid gap-3 md:grid-cols-2">
                        <FormField label="Customer" htmlFor="cust" required>
                            <Select
                                id="cust"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                disabled={mode.kind === 'from-so'}
                            >
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.legalName ?? c.name}</option>
                                ))}
                            </Select>
                        </FormField>
                        {mode.kind === 'from-so' && (
                            <FormField label="Sales order" htmlFor="so">
                                <Select id="so" value={mode.orderId} disabled>
                                    {allOrders.map((o) => (
                                        <option key={o.id} value={o.id}>{o.orderNumber}</option>
                                    ))}
                                </Select>
                            </FormField>
                        )}
                        <FormField label="Invoice date" htmlFor="idate">
                            <Input id="idate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                        </FormField>
                        <FormField label="Due date" htmlFor="ddate">
                            <Input id="ddate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </FormField>
                        <FormField label="Place of supply" htmlFor="pos">
                            <Input id="pos" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
                        </FormField>
                        <FormField label="Payment terms" htmlFor="pt">
                            <Input id="pt" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                        </FormField>
                    </div>

                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Line items</h4>
                            <Button size="sm" variant="outline" onClick={addLine}>
                                <Plus className="size-3.5" /> Add line
                            </Button>
                        </div>
                        <div className="overflow-x-auto rounded-md border border-slate-200">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-2 py-2 text-left">Description</th>
                                        <th className="px-2 py-2 text-right">Qty</th>
                                        <th className="px-2 py-2 text-right">Rate</th>
                                        <th className="px-2 py-2 text-right">Disc %</th>
                                        <th className="px-2 py-2 text-right">GST %</th>
                                        <th className="px-2 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lines.map((l, i) => (
                                        <tr key={l.id}>
                                            <td className="p-1">
                                                <Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
                                            </td>
                                            <td className="p-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={l.quantity}
                                                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={l.unitPrice}
                                                    onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={l.discountPct}
                                                    onChange={(e) => updateLine(i, { discountPct: Number(e.target.value) || 0 })}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={l.taxRate}
                                                    onChange={(e) => updateLine(i, { taxRate: Number(e.target.value) || 0 })}
                                                    className="text-right"
                                                />
                                            </td>
                                            <td className="p-1 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => removeLine(i)} aria-label="Remove line">
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <FormField label="Notes" htmlFor="notes" className="mt-4">
                        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </FormField>

                    <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex justify-between text-slate-700">
                            <span>Taxable value</span>
                            <span>₹ {Math.round(totals.taxable).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                            <span>Total tax</span>
                            <span>₹ {Math.round(totals.totalTax).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-900">
                            <span>Grand total</span>
                            <span>₹ {totals.grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="primary" onClick={submit}>Save as draft</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
