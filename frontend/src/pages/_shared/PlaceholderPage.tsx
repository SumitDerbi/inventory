import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

export interface PlaceholderPageProps {
    title: string;
    description?: string;
    icon: ComponentType<LucideProps>;
    ctaLabel?: string;
}

/**
 * Phase 1 scaffold: every module route renders this until its real
 * list/detail screens ship in later Step files.
 */
export function PlaceholderPage({
    title,
    description,
    icon,
    ctaLabel = 'Coming soon',
}: PlaceholderPageProps) {
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title={title}
                description={description}
                actions={
                    <Button variant="primary">
                        <Plus className="size-4" aria-hidden="true" /> {ctaLabel}
                    </Button>
                }
            />
            <EmptyState
                icon={icon}
                title={`${title} module is on the way`}
                description="List view, filters, and detail screens will land as part of this module's dedicated Step. Click around the sidebar to explore the shell."
            />
        </div>
    );
}
