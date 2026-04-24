import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from 'recharts';
import type { RevenuePoint } from '@/mocks/dashboard';
import { formatCompactINR, formatINR } from '@/lib/format';

export interface RevenueLineChartProps {
    data: RevenuePoint[];
    height?: number;
}

export function RevenueLineChart({ data, height = 280 }: RevenueLineChartProps) {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="month"
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => formatCompactINR(v)}
                        width={72}
                    />
                    <Tooltip content={renderTooltip} />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#2563EB' }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="cost"
                        name="Cost"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#94A3B8' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

interface RechartsTooltipPayloadEntry {
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
}

interface RechartsTooltipProps {
    active?: boolean;
    label?: string | number;
    payload?: readonly RechartsTooltipPayloadEntry[];
}

function renderTooltip(props: TooltipContentProps) {
    const { active, payload, label } = props as unknown as RechartsTooltipProps;
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold text-slate-700">{label}</p>
            <ul className="mt-1 space-y-1">
                {payload.map((entry) => (
                    <li
                        key={String(entry.dataKey)}
                        className="flex items-center gap-2"
                    >
                        <span
                            aria-hidden="true"
                            className="size-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="capitalize text-slate-500">
                            {entry.name}
                        </span>
                        <span className="ml-auto font-medium text-slate-800">
                            {formatINR(
                                typeof entry.value === 'number'
                                    ? entry.value
                                    : Number(entry.value),
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
