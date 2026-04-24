import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ */
/* Base field wrapper                                                  */
/* ------------------------------------------------------------------ */

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Label + control + helper/error layout used across all forms.
 * Pass your own Input/Select/Textarea as children, or use the
 * convenience components below.
 */
export function FormField({
  label,
  htmlFor,
  required,
  helper,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-slate-600"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Input primitives                                                    */
/* ------------------------------------------------------------------ */

const BASE_CONTROL =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

const INVALID_CONTROL =
  'border-red-300 focus:border-red-500 focus:ring-red-500/20';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(BASE_CONTROL, invalid && INVALID_CONTROL, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(BASE_CONTROL, invalid && INVALID_CONTROL, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(BASE_CONTROL, invalid && INVALID_CONTROL, className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

/* ------------------------------------------------------------------ */
/* Convenience wrappers — labelled + wired controls                    */
/* ------------------------------------------------------------------ */

export interface TextFieldProps extends Omit<InputProps, 'id'> {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
}

export function TextField({
  label,
  helper,
  error,
  required,
  containerClassName,
  ...inputProps
}: TextFieldProps) {
  const autoId = useId();
  const id = inputProps.name ? `${inputProps.name}-${autoId}` : autoId;
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      helper={helper}
      error={error}
      className={containerClassName}
    >
      <Input id={id} invalid={Boolean(error)} required={required} {...inputProps} />
    </FormField>
  );
}
