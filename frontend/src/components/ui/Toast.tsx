import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
    title: string;
    description?: string;
    variant?: ToastVariant;
    /** Auto-dismiss duration in ms. Defaults to 3500. Pass 0 to keep open. */
    duration?: number;
}

interface ToastRecord extends ToastInput {
    id: number;
}

interface ToastContextValue {
    push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
    success: 'border-emerald-200 bg-white',
    error: 'border-red-200 bg-white',
    info: 'border-slate-200 bg-white',
    warning: 'border-amber-200 bg-white',
};

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: TriangleAlert,
};

const VARIANT_ICON_CLASS: Record<ToastVariant, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const idRef = useRef(0);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    const dismiss = useCallback((id: number) => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
        const handle = timersRef.current.get(id);
        if (handle) {
            clearTimeout(handle);
            timersRef.current.delete(id);
        }
    }, []);

    const push = useCallback(
        (toast: ToastInput) => {
            idRef.current += 1;
            const id = idRef.current;
            const variant = toast.variant ?? 'info';
            const duration = toast.duration ?? 3500;
            setToasts((curr) => [...curr, { ...toast, variant, id }]);
            if (duration > 0) {
                const handle = setTimeout(() => dismiss(id), duration);
                timersRef.current.set(id, handle);
            }
        },
        [dismiss],
    );

    useEffect(
        () => () => {
            timersRef.current.forEach((handle) => clearTimeout(handle));
            timersRef.current.clear();
        },
        [],
    );

    const value = useMemo<ToastContextValue>(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                aria-live="polite"
                aria-atomic="false"
                className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2"
            >
                <AnimatePresence initial={false}>
                    {toasts.map((t) => {
                        const Icon = VARIANT_ICON[t.variant ?? 'info'];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className={cn(
                                    'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg',
                                    VARIANT_CLASS[t.variant ?? 'info'],
                                )}
                                role="status"
                            >
                                <Icon
                                    className={cn(
                                        'mt-0.5 size-5 shrink-0',
                                        VARIANT_ICON_CLASS[t.variant ?? 'info'],
                                    )}
                                    aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-medium text-slate-800">{t.title}</p>
                                    {t.description && (
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(t.id)}
                                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Dismiss notification"
                                >
                                    <X className="size-3.5" aria-hidden="true" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within <ToastProvider>');
    }
    return ctx;
}
