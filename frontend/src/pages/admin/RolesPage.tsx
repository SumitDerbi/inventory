import { useState } from 'react';
import { ArrowLeft, Check, Save, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { ROLE_TONE, type UserRole } from '@/mocks/users';
import {
    PERMISSION_ACTIONS,
    PERMISSION_MODULE_LABEL,
    PERMISSION_MODULES,
    ROLES,
    type PermissionAction,
    type PermissionMatrix,
    type PermissionModule,
} from '@/mocks/admin';

const ACTION_LABEL: Record<PermissionAction, string> = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
};

export default function RolesPage() {
    const { push } = useToast();
    const [activeRoleId, setActiveRoleId] = useState<UserRole>(ROLES[0].id);
    const [matrix, setMatrix] = useState<PermissionMatrix>(() => ({
        ...ROLES[0].permissions,
    }));

    const role = ROLES.find((r) => r.id === activeRoleId) ?? ROLES[0];

    function selectRole(id: UserRole) {
        const next = ROLES.find((r) => r.id === id) ?? ROLES[0];
        setActiveRoleId(id);
        setMatrix({ ...next.permissions });
    }

    function toggle(module: PermissionModule, action: PermissionAction) {
        setMatrix((prev) => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: !prev[module][action],
            },
        }));
    }

    function setAllForModule(module: PermissionModule, value: boolean) {
        setMatrix((prev) => ({
            ...prev,
            [module]: PERMISSION_ACTIONS.reduce(
                (acc, a) => ({ ...acc, [a]: value }),
                {} as Record<PermissionAction, boolean>,
            ),
        }));
    }

    function handleSave() {
        push({
            variant: 'success',
            title: 'Permissions saved',
            description: `Updated permission matrix for ${role.name}.`,
        });
    }

    return (
        <div>
            <PageHeader
                title="Roles & permissions"
                description="Define what each role can view, create, edit, delete and approve across modules."
                actions={
                    <>
                        <Button asChild variant="outline">
                            <Link to="/users">
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                Back to users
                            </Link>
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="size-4" aria-hidden="true" />
                            Save changes
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
                <aside className="rounded-xl border border-slate-200 bg-white p-2">
                    <ul className="flex flex-col gap-1">
                        {ROLES.map((r) => {
                            const active = r.id === activeRoleId;
                            return (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => selectRole(r.id)}
                                        className={cn(
                                            'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition',
                                            active
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-slate-50 text-slate-700',
                                        )}
                                    >
                                        <ShieldCheck
                                            className={cn(
                                                'mt-0.5 size-4 shrink-0',
                                                active
                                                    ? 'text-primary'
                                                    : 'text-slate-400',
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-medium">
                                                    {r.name}
                                                </span>
                                                <Badge tone={ROLE_TONE[r.id]}>
                                                    {r.userCount}
                                                </Badge>
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">
                                                {r.description}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <header className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-slate-800">
                                {role.name}
                            </h2>
                            <Badge tone={ROLE_TONE[role.id]}>
                                {role.userCount} user
                                {role.userCount === 1 ? '' : 's'}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{role.description}</p>
                    </header>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th
                                        scope="col"
                                        className="border-b border-slate-200 px-4 py-3 text-left font-semibold"
                                    >
                                        Module
                                    </th>
                                    {PERMISSION_ACTIONS.map((a) => (
                                        <th
                                            key={a}
                                            scope="col"
                                            className="border-b border-slate-200 px-4 py-3 text-center font-semibold"
                                        >
                                            {ACTION_LABEL[a]}
                                        </th>
                                    ))}
                                    <th
                                        scope="col"
                                        className="border-b border-slate-200 px-4 py-3 text-right font-semibold"
                                    >
                                        Bulk
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {PERMISSION_MODULES.map((m) => (
                                    <tr
                                        key={m}
                                        className="hover:bg-slate-50/60"
                                    >
                                        <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                                            {PERMISSION_MODULE_LABEL[m]}
                                        </td>
                                        {PERMISSION_ACTIONS.map((a) => {
                                            const enabled = matrix[m][a];
                                            return (
                                                <td
                                                    key={a}
                                                    className="border-b border-slate-100 px-4 py-2 text-center"
                                                >
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={enabled}
                                                        aria-label={`${ACTION_LABEL[a]} ${PERMISSION_MODULE_LABEL[m]}`}
                                                        onClick={() => toggle(m, a)}
                                                        className={cn(
                                                            'inline-flex size-7 items-center justify-center rounded-md border transition',
                                                            enabled
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100',
                                                        )}
                                                    >
                                                        {enabled ? (
                                                            <Check
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <X
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-slate-100 px-4 py-2 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setAllForModule(m, true)
                                                    }
                                                >
                                                    All
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setAllForModule(m, false)
                                                    }
                                                >
                                                    None
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
