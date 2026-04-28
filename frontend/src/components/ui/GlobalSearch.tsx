import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
    groupResults,
    SEARCH_TYPE_LABEL,
    searchAll,
    type SearchResult,
} from '@/mocks/search';

export interface GlobalSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const results = useMemo(() => searchAll(q), [q]);
    const groups = useMemo(() => groupResults(results), [results]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setQ('');
            setActiveIdx(0);
        } else {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        if (activeIdx >= results.length) setActiveIdx(0);
    }, [results, activeIdx]);

    function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => Math.min(results.length - 1, i + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => Math.max(0, i - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const r = results[activeIdx];
            if (r) {
                navigate(r.href);
                onOpenChange(false);
            }
        }
    }

    function go(r: SearchResult) {
        navigate(r.href);
        onOpenChange(false);
    }

    // Compute flat-index per row to highlight the selected one
    let runningIdx = 0;

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                    )}
                />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-1/2 top-[12vh] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl outline-none',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95',
                    )}
                    aria-label="Global search"
                >
                    <DialogPrimitive.Title className="sr-only">
                        Global search
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Search inquiries, quotations, orders, jobs, documents, customers, vendors and purchase records.
                    </DialogPrimitive.Description>
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4">
                        <Search
                            className="size-4 text-slate-400"
                            aria-hidden="true"
                        />
                        <input
                            ref={inputRef}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Search inquiries, quotes, orders, vendors, POs, GRNs…"
                            className="flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            aria-label="Search"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <DialogPrimitive.Close
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </DialogPrimitive.Close>
                    </div>

                    <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-1">
                        {q.trim().length < 2 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                Type at least 2 characters to search.
                                <p className="mt-2 text-xs text-slate-400">
                                    Try{' '}
                                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">
                                        INQ-
                                    </kbd>
                                    ,{' '}
                                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">
                                        Q-
                                    </kbd>
                                    ,{' '}
                                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">
                                        SO-
                                    </kbd>
                                    , a customer name or document tag.
                                </p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                No matches for{' '}
                                <span className="font-medium text-slate-700">
                                    “{q}”
                                </span>
                            </div>
                        ) : (
                            groups.map((g) => (
                                <div key={g.type} className="px-1 py-1">
                                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        {SEARCH_TYPE_LABEL[g.type]}
                                    </div>
                                    {g.rows.map((r) => {
                                        const idx = runningIdx++;
                                        const isActive = idx === activeIdx;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onMouseEnter={() => setActiveIdx(idx)}
                                                onClick={() => go(r)}
                                                className={cn(
                                                    'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm',
                                                    isActive
                                                        ? 'bg-primary/10 text-slate-900'
                                                        : 'text-slate-700 hover:bg-slate-50',
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-medium">
                                                        {r.title}
                                                    </div>
                                                    <div className="truncate text-xs text-slate-500">
                                                        {r.subtitle}
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                                                    {r.matchedField}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
                        <span>
                            <kbd className="rounded border border-slate-200 bg-white px-1 font-mono">
                                ↑
                            </kbd>{' '}
                            <kbd className="rounded border border-slate-200 bg-white px-1 font-mono">
                                ↓
                            </kbd>{' '}
                            navigate ·{' '}
                            <kbd className="rounded border border-slate-200 bg-white px-1 font-mono">
                                Enter
                            </kbd>{' '}
                            open ·{' '}
                            <kbd className="rounded border border-slate-200 bg-white px-1 font-mono">
                                Esc
                            </kbd>{' '}
                            close
                        </span>
                        <span>{results.length} result(s)</span>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
