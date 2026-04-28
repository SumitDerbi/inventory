import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { CustomerInvoiceTable } from '@/components/customer-invoices/CustomerInvoiceTable';
import { CustomerInvoiceKPIRow } from '@/components/customer-invoices/CustomerInvoiceKPIRow';
import { CustomerInvoiceFilterBar } from '@/components/customer-invoices/CustomerInvoiceFilterBar';
import {
    EMPTY_FILTER,
    applyInvoiceFilters,
    type CustomerInvoiceFilterValue,
} from '@/components/customer-invoices/invoice-filter';
import { CustomerInvoiceForm } from '@/components/customer-invoices/CustomerInvoiceForm';
import { customerInvoicesAll } from '@/mocks/customer-invoices';

export default function CustomerInvoiceListPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<CustomerInvoiceFilterValue>(EMPTY_FILTER);
    const [createOpen, setCreateOpen] = useState(false);
    const [version, setVersion] = useState(0);

    const all = customerInvoicesAll();
    void version; // re-render trigger
    const rows = applyInvoiceFilters(all, filter);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Customer invoices"
                description="Tax invoices raised against sales orders or as direct invoices."
                breadcrumb={[
                    { label: 'Sales', href: '/orders' },
                    { label: 'Invoices' },
                ]}
                actions={
                    <Button variant="primary" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" /> New invoice
                    </Button>
                }
            />

            <CustomerInvoiceKPIRow rows={all} />

            <CustomerInvoiceFilterBar value={filter} onChange={setFilter} />

            <CustomerInvoiceTable rows={rows} onRowClick={(i) => navigate(`/sales/invoices/${i.id}`)} />

            <CustomerInvoiceForm
                open={createOpen}
                onOpenChange={setCreateOpen}
                mode={{ kind: 'standalone' }}
                onCreated={(inv) => {
                    setVersion((v) => v + 1);
                    navigate(`/sales/invoices/${inv.id}`);
                }}
            />
        </div>
    );
}
