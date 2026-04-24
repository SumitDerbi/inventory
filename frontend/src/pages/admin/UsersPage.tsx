import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import {
    DataTable,
    type DataTableColumn,
} from '@/components/ui/DataTable';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/Sheet';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatRelative } from '@/lib/format';
import {
    DEPARTMENTS,
    ROLE_LABEL,
    ROLE_TONE,
    type MockUser,
    type UserRole,
    users,
} from '@/mocks/users';

type StatusFilter = 'all' | 'active' | 'inactive';

const ROLE_OPTIONS: UserRole[] = [
    'admin',
    'sales_manager',
    'sales_executive',
    'inventory',
    'dispatch',
    'engineer',
    'accounts',
];

interface DraftUser {
    name: string;
    email: string;
    mobile: string;
    employeeCode: string;
    department: string;
    designation: string;
    role: UserRole;
    active: boolean;
    notes: string;
}

const EMPTY_DRAFT: DraftUser = {
    name: '',
    email: '',
    mobile: '',
    employeeCode: '',
    department: 'Sales',
    designation: '',
    role: 'sales_executive',
    active: true,
    notes: '',
};

function userToDraft(u: MockUser): DraftUser {
    return {
        name: u.name,
        email: u.email,
        mobile: u.mobile ?? '',
        employeeCode: u.employeeCode ?? '',
        department: u.department ?? 'Sales',
        designation: u.designation ?? '',
        role: u.role,
        active: u.active ?? true,
        notes: u.notes ?? '',
    };
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function UsersPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<MockUser | null>(null);
    const [draft, setDraft] = useState<DraftUser>(EMPTY_DRAFT);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (statusFilter === 'active' && u.active === false) return false;
            if (statusFilter === 'inactive' && u.active !== false) return false;
            if (!q) return true;
            return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.employeeCode ?? '').toLowerCase().includes(q) ||
                (u.department ?? '').toLowerCase().includes(q)
            );
        });
    }, [search, roleFilter, statusFilter]);

    const summary = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.active !== false).length;
        const admins = users.filter((u) => u.role === 'admin').length;
        const engineers = users.filter((u) => u.role === 'engineer').length;
        return { total, active, admins, engineers };
    }, []);

    function handleNew() {
        setEditing(null);
        setDraft(EMPTY_DRAFT);
        setOpen(true);
    }

    function handleEdit(u: MockUser) {
        setEditing(u);
        setDraft(userToDraft(u));
        setOpen(true);
    }

    function handleSave() {
        if (draft.name.trim().length < 2 || !draft.email.includes('@')) {
            push({
                variant: 'error',
                title: 'Missing fields',
                description: 'Name and a valid email are required.',
            });
            return;
        }
        push({
            variant: 'success',
            title: editing ? 'User updated' : 'User invited',
            description: `${draft.name} (${ROLE_LABEL[draft.role]})`,
        });
        setOpen(false);
    }

    function handleDelete() {
        if (!editing) return;
        push({
            variant: 'success',
            title: 'User removed',
            description: `${editing.name} can no longer sign in.`,
        });
        setOpen(false);
    }

    const columns: DataTableColumn<MockUser>[] = [
        {
            key: 'name',
            header: 'Name',
            cell: (u) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(u);
                    }}
                    className="flex items-center gap-3 text-left"
                >
                    <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                        aria-hidden="true"
                    >
                        {initials(u.name)}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-800 hover:text-primary">
                            {u.name}
                        </span>
                        {u.designation && (
                            <span className="block truncate text-xs text-slate-400">
                                {u.designation}
                            </span>
                        )}
                    </span>
                </button>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            cell: (u) => (
                <a
                    href={`mailto:${u.email}`}
                    className="text-slate-600 hover:text-primary hover:underline"
                >
                    {u.email}
                </a>
            ),
        },
        {
            key: 'role',
            header: 'Role',
            cell: (u) => (
                <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
            ),
        },
        {
            key: 'department',
            header: 'Department',
            cell: (u) => (
                <span className="text-slate-600">
                    {u.department ?? '—'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (u) =>
                u.active === false ? (
                    <Badge tone="neutral">Disabled</Badge>
                ) : (
                    <Badge tone="emerald">Active</Badge>
                ),
        },
        {
            key: 'lastLogin',
            header: 'Last login',
            align: 'right',
            cell: (u) => (
                <span className="text-xs text-slate-500">
                    {formatRelative(u.lastLoginAt)}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Users"
                description="Manage team members, role assignments and access."
                actions={
                    <>
                        <Button asChild variant="outline">
                            <Link to="/users/roles">
                                <ShieldCheck className="size-4" aria-hidden="true" />
                                Roles &amp; permissions
                            </Link>
                        </Button>
                        <Button onClick={handleNew}>
                            <Plus className="size-4" aria-hidden="true" />
                            New user
                        </Button>
                    </>
                }
            />

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryStat label="Total users" value={summary.total} />
                <SummaryStat label="Active" value={summary.active} tone="emerald" />
                <SummaryStat label="Administrators" value={summary.admins} tone="red" />
                <SummaryStat label="Engineers" value={summary.engineers} tone="sky" />
            </div>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by name, email, code or department"
                filters={
                    <>
                        <Select
                            aria-label="Role"
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(e.target.value as UserRole | 'all')
                            }
                            className="w-44"
                        >
                            <option value="all">All roles</option>
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                    {ROLE_LABEL[r]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Status"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as StatusFilter)
                            }
                            className="w-36"
                        >
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Disabled</option>
                        </Select>
                    </>
                }
                actions={
                    (search || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                        >
                            Reset
                        </Button>
                    )
                }
            />

            <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(u) => u.id}
                onRowClick={handleEdit}
            />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="w-[420px] max-w-[92vw]">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? `Edit ${editing.name}` : 'Invite user'}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <div className="grid gap-3">
                            <FormField label="Full name" required>
                                <Input
                                    value={draft.name}
                                    onChange={(e) =>
                                        setDraft({ ...draft, name: e.target.value })
                                    }
                                    placeholder="e.g. Aarav Mehta"
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Email" required>
                                    <Input
                                        type="email"
                                        value={draft.email}
                                        onChange={(e) =>
                                            setDraft({
                                                ...draft,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="user@firm.in"
                                    />
                                </FormField>
                                <FormField label="Mobile">
                                    <Input
                                        value={draft.mobile}
                                        onChange={(e) =>
                                            setDraft({
                                                ...draft,
                                                mobile: e.target.value,
                                            })
                                        }
                                        placeholder="+91 ..."
                                    />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Employee code">
                                    <Input
                                        value={draft.employeeCode}
                                        onChange={(e) =>
                                            setDraft({
                                                ...draft,
                                                employeeCode: e.target.value,
                                            })
                                        }
                                        placeholder="EMP-1023"
                                    />
                                </FormField>
                                <FormField label="Department">
                                    <Select
                                        value={draft.department}
                                        onChange={(e) =>
                                            setDraft({
                                                ...draft,
                                                department: e.target.value,
                                            })
                                        }
                                    >
                                        {DEPARTMENTS.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                            </div>
                            <FormField label="Designation">
                                <Input
                                    value={draft.designation}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            designation: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Sr. Sales Executive"
                                />
                            </FormField>
                            <FormField label="Role" required>
                                <Select
                                    value={draft.role}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            role: e.target.value as UserRole,
                                        })
                                    }
                                >
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r} value={r}>
                                            {ROLE_LABEL[r]}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                            <FormField label="Profile photo">
                                <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                                    <span
                                        className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                                        aria-hidden="true"
                                    >
                                        {initials(draft.name || 'NU')}
                                    </span>
                                    <Button variant="outline" size="sm" type="button">
                                        Upload photo
                                    </Button>
                                </div>
                            </FormField>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={draft.active}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            active: e.target.checked,
                                        })
                                    }
                                    className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                Active — user can sign in
                            </label>
                            <FormField label="Notes">
                                <Textarea
                                    rows={3}
                                    value={draft.notes}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="Internal notes for this user…"
                                />
                            </FormField>
                        </div>
                    </div>
                    <SheetFooter>
                        {editing && (
                            <Button
                                variant="ghost"
                                onClick={handleDelete}
                                className="mr-auto text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Remove
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editing ? 'Save changes' : 'Send invite'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function SummaryStat({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: 'emerald' | 'red' | 'sky';
}) {
    const toneClass =
        tone === 'emerald'
            ? 'text-emerald-700'
            : tone === 'red'
              ? 'text-red-700'
              : tone === 'sky'
                ? 'text-sky-700'
                : 'text-slate-800';
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>
                {value}
            </div>
        </div>
    );
}
