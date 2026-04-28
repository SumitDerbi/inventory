import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea, Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { createPortalTicket } from '@/mocks/portal/portal-tickets';

export default function PortalTicketNewPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [submitting, setSubmitting] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (subject.trim().length < 5 || body.trim().length < 10) return;
        setSubmitting(true);
        const t = createPortalTicket({ subject, body, priority });
        toast.push({
            title: 'Ticket raised',
            description: `${t.id.toUpperCase()} — we'll respond within one business day.`,
            variant: 'success',
        });
        navigate(`/portal/tickets/${t.id}`, { replace: true });
    }

    return (
        <div className="space-y-4">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/portal/tickets')}>
                <ArrowLeft className="size-4" /> Back to tickets
            </Button>

            <PageHeader title="Raise a support ticket" />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <FormField label="Subject" htmlFor="t-subject" required>
                    <Input
                        id="t-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Short summary of your request"
                    />
                </FormField>

                <FormField label="Details" htmlFor="t-body" required>
                    <Textarea
                        id="t-body"
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Describe your question or issue. Include order numbers and dates where relevant."
                    />
                </FormField>

                <FormField label="Priority" htmlFor="t-pri">
                    <Select id="t-pri" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </Select>
                </FormField>

                <div className="flex gap-2">
                    <Button type="submit" variant="primary" disabled={submitting}>Submit ticket</Button>
                    <Button type="button" variant="ghost" onClick={() => navigate('/portal/tickets')}>Cancel</Button>
                </div>
            </form>
        </div>
    );
}
