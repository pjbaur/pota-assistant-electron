import type { ReactNode, ComponentProps } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps): JSX.Element {
  const rootProps: ComponentProps<typeof RadixDialog.Root> = {};
  if (open !== undefined) {
    rootProps.open = open;
  }
  if (onOpenChange !== undefined) {
    rootProps.onOpenChange = onOpenChange;
  }

  return (
    <RadixDialog.Root {...rootProps}>
      {children}
    </RadixDialog.Root>
  );
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps): JSX.Element {
  return (
    <RadixDialog.Trigger asChild={asChild ?? false}>
      {children}
    </RadixDialog.Trigger>
  );
}

export function DialogContent({
  children,
  title,
  description,
  className = '',
}: DialogContentProps): JSX.Element {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
      <RadixDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 data-[state=open]:animate-fade-in ${className}`}
      >
        <RadixDialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </RadixDialog.Title>
        {description && (
          <RadixDialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </RadixDialog.Description>
        )}
        <div className="mt-4">{children}</div>
        <RadixDialog.Close className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogClose({ children }: { children: ReactNode }): JSX.Element {
  return <RadixDialog.Close asChild>{children}</RadixDialog.Close>;
}
