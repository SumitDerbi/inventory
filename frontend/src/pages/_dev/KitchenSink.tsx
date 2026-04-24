/**
 * Dev-only showcase rendering every design-system component in all states.
 * Delete or gate behind `import.meta.env.DEV` before shipping.
 */
import {
  Activity,
  Download,
  IndianRupee,
  Package,
  Plus,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FilterBar } from '@/components/ui/FilterBar';
import {
  FormField,
  Input,
  Select,
  TextField,
  Textarea,
} from '@/components/ui/FormField';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  PriorityBadge,
  PRIORITY_KEYS,
} from '@/components/ui/PriorityBadge';
import { StatCard } from '@/components/ui/StatCard';
import {
  STATUS_KEYS,
  StatusBadge,
} from '@/components/ui/StatusBadge';
import { FadeIn } from '@/components/motion/FadeIn';
import { formatINR } from '@/lib/format';

interface DemoRow {
  id: string;
  customer: string;
  status: string;
  priority: string;
  amount: number;
}

const DEMO_ROWS: DemoRow[] = [
  {
    id: 'INQ-00021',
    customer: 'Reliance Fire Services',
    status: 'New',
    priority: 'High',
    amount: 450000,
  },
  {
    id: 'INQ-00022',
    customer: 'Tata Realty — Mumbai',
    status: 'Quoted',
    priority: 'Medium',
    amount: 1250000,
  },
  {
    id: 'INQ-00023',
    customer: 'L&T Construction',
    status: 'Confirmed',
    priority: 'Urgent',
    amount: 875000,
  },
  {
    id: 'INQ-00024',
    customer: 'Godrej Properties',
    status: 'Lost',
    priority: 'Low',
    amount: 220000,
  },
];

const COLUMNS: DataTableColumn<DemoRow>[] = [
  { key: 'id', header: 'Ref #', cell: (r) => <span className="data-value">{r.id}</span> },
  { key: 'customer', header: 'Customer', cell: (r) => r.customer },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: 'priority',
    header: 'Priority',
    cell: (r) => <PriorityBadge priority={r.priority} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (r) => <span className="data-value">{formatINR(r.amount)}</span>,
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="section-header">{title}</h2>
      <div className="card">{children}</div>
    </section>
  );
}

export default function KitchenSink() {
  return (
    <FadeIn className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader
          title="Design System — Kitchen Sink"
          description="Every reusable component in all its states. Delete this page before production."
          breadcrumb={[
            { label: 'Home', href: '#' },
            { label: 'Dev' },
            { label: 'Kitchen Sink' },
          ]}
          actions={
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-4" aria-hidden="true" /> Export
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <Plus className="size-4" aria-hidden="true" /> New Inquiry
              </button>
            </>
          }
        />

        <Section title="Stat cards">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Inquiries (MTD)"
              value="128"
              delta={12}
              deltaLabel="vs. last month"
              icon={Activity}
              tone="blue"
            />
            <StatCard
              label="Revenue"
              value={formatINR(4580000)}
              delta={-4}
              deltaLabel="vs. last month"
              icon={IndianRupee}
              tone="emerald"
            />
            <StatCard
              label="Orders"
              value="47"
              delta={0}
              icon={ShoppingCart}
              tone="violet"
            />
            <StatCard
              label="Low-stock SKUs"
              value="6"
              icon={TriangleAlert}
              tone="amber"
            />
          </div>
        </Section>

        <Section title="Status badges">
          <div className="flex flex-wrap gap-2">
            {STATUS_KEYS.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
            <StatusBadge status="Unknown" />
          </div>
        </Section>

        <Section title="Priority badges">
          <div className="flex flex-wrap gap-2">
            {PRIORITY_KEYS.map((p) => (
              <PriorityBadge key={p} priority={p} />
            ))}
          </div>
        </Section>

        <Section title="Generic Badge tones">
          <div className="flex flex-wrap gap-2">
            {(
              [
                'neutral',
                'blue',
                'sky',
                'violet',
                'emerald',
                'green',
                'amber',
                'orange',
                'red',
                'indigo',
                'urgent',
              ] as const
            ).map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Alerts">
          <div className="space-y-3">
            <ErrorAlert
              variant="info"
              title="Heads up"
              description="All numbers on this screen are mock data."
            />
            <ErrorAlert
              variant="success"
              title="Saved"
              description="Quotation QT-00042 was sent to the customer."
            />
            <ErrorAlert
              variant="warning"
              title="Low stock"
              description="3 SKUs are below reorder level."
            />
            <ErrorAlert
              variant="danger"
              title="Something went wrong"
              description="The request could not be completed. Please retry."
            />
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Customer name"
              name="customer"
              placeholder="e.g. Reliance Fire Services"
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              helper="We'll use this to send quotations."
            />
            <TextField
              label="Phone"
              name="phone"
              placeholder="+91 98765 43210"
              error="Phone number is required."
            />
            <FormField label="Status" htmlFor="demo-status">
              <Select id="demo-status" defaultValue="">
                <option value="" disabled>
                  Select status
                </option>
                {STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Notes"
              htmlFor="demo-notes"
              helper="Internal notes, not visible to the customer."
              className="md:col-span-2"
            >
              <Textarea id="demo-notes" placeholder="Type your notes…" />
            </FormField>
            <FormField label="Disabled input" htmlFor="demo-disabled">
              <Input id="demo-disabled" value="Read only" disabled readOnly />
            </FormField>
          </div>
        </Section>

        <Section title="Filter bar + DataTable">
          <FilterBar
            searchPlaceholder="Search inquiries…"
            filters={
              <Select defaultValue="">
                <option value="">All statuses</option>
                {STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            }
            actions={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-4" aria-hidden="true" /> Export CSV
              </button>
            }
          />
          <DataTable
            columns={COLUMNS}
            rows={DEMO_ROWS}
            rowKey={(r) => r.id}
            caption="Recent inquiries"
          />
        </Section>

        <Section title="DataTable — loading state">
          <DataTable
            columns={COLUMNS}
            rows={[]}
            rowKey={() => 'x'}
            isLoading
          />
        </Section>

        <Section title="DataTable — empty state">
          <DataTable columns={COLUMNS} rows={[]} rowKey={() => 'x'} />
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon={Package}
            title="No products in this category"
            description="Add your first product to start quoting."
            action={
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <Plus className="size-4" aria-hidden="true" /> Add product
              </button>
            }
          />
        </Section>

        <Section title="Loading skeletons">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <LoadingSkeleton rows={4} />
            <LoadingSkeleton variant="table" rows={4} />
          </div>
        </Section>
      </div>
    </FadeIn>
  );
}
