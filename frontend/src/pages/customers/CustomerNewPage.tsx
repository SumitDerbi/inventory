import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { findDuplicates, type Customer } from '@/mocks/customers';

export default function CustomerNewPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [name, setName] = useState('');
    const [legalName, setLegalName] = useState('');
    const [gst, setGst] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [segment, setSegment] = useState('');
    const [territory, setTerritory] = useState('');
    const [duplicates, setDuplicates] = useState<Customer[]>([]);

    const canSubmit = useMemo(
        () => name.trim().length > 0 && phone.trim().length > 0,
        [name, phone],
    );

    function checkDuplicates() {
        if (!phone && !email && !gst) {
            setDuplicates([]);
            return;
        }
        const dupes = findDuplicates({
            mobile: phone,
            email,
            gst,
        });
        setDuplicates(dupes);
    }

    function handleSubmit() {
        if (!canSubmit) return;
        push({
            variant: 'success',
            title: 'Customer created',
            description: `${name} has been added.`,
        });
        navigate('/customers');
    }

    return (
        <div>
            <PageHeader
                title="New customer"
                breadcrumb={[
                    { label: 'Customers', href: '/customers' },
                    { label: 'New' },
                ]}
                actions={
                    <Button variant="outline" onClick={() => navigate('/customers')}>
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back
                    </Button>
                }
            />

            <form
                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <FormField label="Display name" required>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </FormField>
                <FormField label="Legal name">
                    <Input
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                    />
                </FormField>
                <FormField label="GST number">
                    <Input
                        value={gst}
                        onChange={(e) => setGst(e.target.value.toUpperCase())}
                        onBlur={checkDuplicates}
                        placeholder="22AAAAA0000A1Z5"
                    />
                </FormField>
                <FormField label="Primary phone" required>
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={checkDuplicates}
                        placeholder="+91-9XXXXXXXXX"
                    />
                </FormField>
                <FormField label="Primary email">
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={checkDuplicates}
                    />
                </FormField>
                <FormField label="Segment">
                    <Select
                        value={segment}
                        onChange={(e) => setSegment(e.target.value)}
                    >
                        <option value="">Select…</option>
                        <option value="enterprise">Enterprise</option>
                        <option value="mid_market">Mid-market</option>
                        <option value="sme">SME</option>
                    </Select>
                </FormField>
                <FormField label="Territory">
                    <Input
                        value={territory}
                        onChange={(e) => setTerritory(e.target.value)}
                    />
                </FormField>

                {duplicates.length > 0 && (
                    <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                        <p className="flex items-center gap-2 font-medium text-amber-800">
                            <AlertTriangle
                                className="size-4"
                                aria-hidden="true"
                            />
                            Possible duplicate(s) detected
                        </p>
                        <ul className="mt-1 space-y-0.5 text-amber-700">
                            {duplicates.map((d) => (
                                <li key={d.id}>
                                    <Link
                                        to={`/customers/${d.id}`}
                                        className="underline"
                                    >
                                        {d.name}
                                    </Link>{' '}
                                    — {d.gstNumber ?? 'no GST'} ·{' '}
                                    {d.primaryContact.phone}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/customers')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
}
