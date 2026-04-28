import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, IndianRupee } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/Dialog';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import {
    portalQuotationById,
    canApprovePortalQuote,
    approvePortalQuote,
    rejectPortalQuote,
    quotationStatusTone,
    type PortalQuotationLine,
} from '@/mocks/portal/portal-quotations';
import { usePortalAuth } from '@/app/portal-context';
import { formatINR } from '@/lib/format';

export default function PortalQuotationDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const { user } = usePortalAuth();
    const toast = useToast();

    const [quote, setQuote] = useState(() => portalQuotationById(id));
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [reason, setReason] = useState('');

    if (!quote) {
        return (
            <EmptyState
                title="Quotation not found"
                description="It may have been withdrawn or is not accessible from your account."
                action={
                    <Button asChild variant="primary" size="sm">
                        <Link to="/portal/quotations"><ArrowLeft className="size-4" /> Back</Link>
                    </Button>
                }
            />
        );
    }

    const canApprove = canApprovePortalQuote(quote);

    function onApprove() {
        if (!user) return;
        const updated = approvePortalQuote(quote!.id, { name: user.name, designation: user.designation });
        if (updated) setQuote(updated);
        setApproveOpen(false);
        setConfirmText('');
        toast.push({
            title: 'Quotation approved',
            description: 'Our team will reach out to confirm next steps.',
            variant: 'success',
        });
    }

    function onReject() {
        if (!user) return;
        const updated = rejectPortalQuote(quote!.id, reason || 'No reason provided', {
            name: user.name,
            designation: user.designation,
        });
        if (updated) setQuote(updated);
        setRejectOpen(false);
        setReason('');
        toast.push({
            title: 'Quotation declined',
            description: 'Sales team has been notified.',
            variant: 'info',
        });
    }

    const cols: DataTableColumn<PortalQuotationLine>[] = [
        { key: 'desc', header: 'Item', cell: (l) => (
            <div>
                <div className="font-medium text-slate-900">{l.description}</div>
                {l.specNotes && <div className="text-xs text-slate-500">{l.specNotes}</div>}
            </div>
        ) },
        { key: 'qty', header: 'Qty', align: 'right', cell: (l) => `${l.quantity} ${l.uom}` },
        { key: 'rate', header: 'Rate', align: 'right', cell: (l) => formatINR(l.unitPrice) },
        { key: 'tax', header: 'Tax', align: 'right', cell: (l) => `${l.taxRate}%` },
        { key: 'amt', header: 'Amount', align: 'right', cell: (l) => formatINR(l.lineTotal) },
    ];

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/portal/quotations"><ArrowLeft className="size-4" /> All quotations</Link>
            </Button>

            <PageHeader
                title={quote.quotationNumber}
                description={quote.projectName}
                actions={<Badge tone={quotationStatusTone(quote.status)}>{quote.statusLabel}</Badge>}
            />

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <Calendar className="size-3.5" /> Valid until
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                        {new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <IndianRupee className="size-3.5" /> Grand total
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatINR(quote.grandTotal)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <FileText className="size-3.5" /> Terms
                    </div>
                    <div className="mt-1 text-xs text-slate-700">
                        <div><b>Payment:</b> {quote.paymentTerms}</div>
                        <div><b>Delivery:</b> {quote.deliveryPeriod}</div>
                        <div><b>Warranty:</b> {quote.warranty}</div>
                    </div>
                </div>
            </div>

            <section>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Line items</h2>
                <DataTable columns={cols} rows={quote.lines} rowKey={(l) => l.id} />
            </section>

            {quote.termsBody && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="mb-2 text-sm font-semibold text-slate-800">Terms &amp; conditions</h2>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600">{quote.termsBody}</pre>
                </section>
            )}

            {canApprove && (
                <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 md:bottom-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-blue-900">Action needed</div>
                        <div className="text-xs text-blue-700">
                            Approve to confirm the order, or share concerns to request a revision.
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setRejectOpen(true)}>Decline / Revise</Button>
                        <Button variant="primary" onClick={() => setApproveOpen(true)}>Approve quotation</Button>
                    </div>
                </div>
            )}

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve quotation {quote.quotationNumber}</DialogTitle>
                        <DialogDescription>
                            This binds your organisation to the quoted scope and price. Type
                            <b> APPROVE </b>to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Confirmation" htmlFor="ap-text" required>
                            <Input
                                id="ap-text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type APPROVE"
                            />
                        </FormField>
                        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Approving as <b>{user?.name}</b>, {user?.designation} on behalf of your organisation.
                        </p>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setApproveOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            disabled={confirmText.trim().toUpperCase() !== 'APPROVE'}
                            onClick={onApprove}
                        >
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline / request revision</DialogTitle>
                        <DialogDescription>Share your concerns with the sales team.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Reason" htmlFor="rj-reason" required>
                            <Textarea
                                id="rj-reason"
                                rows={4}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Pricing concerns, scope changes, timeline, etc."
                            />
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="danger" disabled={reason.trim().length < 5} onClick={onReject}>
                            Send to sales team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
