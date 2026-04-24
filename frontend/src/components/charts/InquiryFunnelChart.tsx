import type { FunnelStage } from '@/mocks/dashboard';

export interface InquiryFunnelChartProps {
    stages: FunnelStage[];
}

/**
 * Horizontal bar rendering of the inquiry funnel, with conversion % from the
 * entry stage. We render as plain HTML/CSS (no recharts) so it stays crisp at
 * any container size and avoids shipping FunnelChart just for 5 rows.
 */
export function InquiryFunnelChart({ stages }: InquiryFunnelChartProps) {
    if (stages.length === 0) return null;
    const top = stages[0].value || 1;
    return (
        <ul className="space-y-3">
            {stages.map((stage) => {
                const pct = Math.round((stage.value / top) * 100);
                return (
                    <li key={stage.id}>
                        <div className="mb-1 flex items-baseline justify-between text-xs">
                            <span className="font-medium text-slate-700">
                                {stage.label}
                            </span>
                            <span className="text-slate-500">
                                <span className="font-semibold text-slate-800">
                                    {stage.value}
                                </span>
                                <span className="ml-2 text-slate-400">{pct}%</span>
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full transition-[width] duration-500"
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: stage.color,
                                }}
                                aria-hidden="true"
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
