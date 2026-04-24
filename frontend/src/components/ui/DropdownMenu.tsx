/* eslint-disable react-refresh/only-export-components */
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuContent = forwardRef<
    ComponentRef<typeof DropdownMenuPrimitive.Content>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cn(
                    'z-50 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
});

export interface DropdownMenuItemProps
    extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
    inset?: boolean;
    destructive?: boolean;
}

export const DropdownMenuItem = forwardRef<
    ComponentRef<typeof DropdownMenuPrimitive.Item>,
    DropdownMenuItemProps
>(function DropdownMenuItem({ className, inset, destructive, ...props }, ref) {
    return (
        <DropdownMenuPrimitive.Item
            ref={ref}
            className={cn(
                'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
                'data-[highlighted]:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                destructive
                    ? 'text-red-600 data-[highlighted]:bg-red-50'
                    : 'text-slate-700',
                inset && 'pl-8',
                className,
            )}
            {...props}
        />
    );
});

export const DropdownMenuLabel = forwardRef<
    ComponentRef<typeof DropdownMenuPrimitive.Label>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
    return (
        <DropdownMenuPrimitive.Label
            ref={ref}
            className={cn(
                'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400',
                className,
            )}
            {...props}
        />
    );
});

export const DropdownMenuSeparator = forwardRef<
    ComponentRef<typeof DropdownMenuPrimitive.Separator>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
    return (
        <DropdownMenuPrimitive.Separator
            ref={ref}
            className={cn('-mx-1 my-1 h-px bg-slate-100', className)}
            {...props}
        />
    );
});

export function DropdownMenuShortcut({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn('ml-auto text-xs tracking-widest text-slate-400', className)}
            {...props}
        />
    );
}
