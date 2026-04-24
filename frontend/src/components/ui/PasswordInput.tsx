import type { InputHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PasswordInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    invalid?: boolean;
}

/**
 * Password input with a show/hide toggle button.
 * Styling mirrors `Input` in FormField.tsx so it fits inside any `FormField`.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    function PasswordInput({ className, invalid, ...rest }, ref) {
        const [visible, setVisible] = useState(false);
        return (
            <div className="relative">
                <input
                    ref={ref}
                    type={visible ? 'text' : 'password'}
                    aria-invalid={invalid || undefined}
                    className={cn(
                        'w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                        invalid &&
                            'border-red-300 focus:border-red-500 focus:ring-red-500/20',
                        className,
                    )}
                    {...rest}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-primary"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                >
                    {visible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                        <Eye className="size-4" aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    },
);
