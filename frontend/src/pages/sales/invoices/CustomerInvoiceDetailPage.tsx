import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CustomerInvoiceDetail } from '@/components/customer-invoices/CustomerInvoiceDetail';
import {
    customerInvoiceById,
    updateInvoiceStatus,
} from '@/mocks/customer-invoices';
import { useState } from 'react';

export default function CustomerInvoiceDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const toast = useToast();
    const [, force] = useState(0);
    const invoice = customerInvoiceById(id);

    if (!invoice) {
        return <Navigate to="/sales/invoices" replace />;
    }

    function handleSend() {
        if (!invoice) return;
        updateInvoiceStatus(invoice.id, 'sent');
        toast.push({ title: `${invoice.invoiceNumber} sent`, variant: 'success' });
        force((n) => n + 1);
    }
    function handleMarkPaid() {
        if (!invoice) return;
        updateInvoiceStatus(invoice.id, 'paid');
        toast.push({ title: `${invoice.invoiceNumber} marked paid`, variant: 'success' });
        force((n) => n + 1);
    }
    function handleCancel() {
        if (!invoice) return;
        updateInvoiceStatus(invoice.id, 'cancelled');
        toast.push({ title: `${invoice.invoiceNumber} cancelled`, variant: 'success' });
        force((n) => n + 1);
    }
    function handleDownload() {
        if (!invoice) return;
        toast.push({
            title: 'Generating PDF',
            description: `${invoice.invoiceNumber} — link will be emailed shortly.`,
            variant: 'success',
        });
    }

    return (
        <div className="space-y-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/sales/invoices">
                    <ArrowLeft className="size-4" /> Back to invoices
                </Link>
            </Button>
            <PageHeader
                title={invoice.invoiceNumber}
                breadcrumb={[
                    { label: 'Sales', href: '/orders' },
                    { label: 'Invoices', href: '/sales/invoices' },
                    { label: invoice.invoiceNumber },
                ]}
            />
            <CustomerInvoiceDetail
                invoice={invoice}
                onSend={handleSend}
                onMarkPaid={handleMarkPaid}
                onCancel={handleCancel}
                onDownload={handleDownload}
            />
        </div>
    );
}
