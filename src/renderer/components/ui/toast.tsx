import React from 'react';
import * as RadixToast from '@radix-ui/react-toast';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastProps {
  toast: Toast;
  onOpenChange: (open: boolean) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  success: 'bg-success-50 dark:bg-success-900/20 border-success-500 text-success-700 dark:text-success-300',
  error: 'bg-error-50 dark:bg-error-900/20 border-error-500 text-error-700 dark:text-error-300',
  warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-500 text-warning-700 dark:text-warning-300',
};

export function Toast({ toast, onOpenChange }: ToastProps): JSX.Element {
  const variant = toast.variant ?? 'default';

  return (
    <RadixToast.Root
      className={`${variantStyles[variant]} group relative flex w-full items-center justify-between overflow-hidden rounded-lg border p-4 shadow-lg data-[state=open]:animate-slide-down data-[state=closed]:animate-fade-in data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-[slideRight_100ms_ease-out]`}
      open={true}
      onOpenChange={onOpenChange}
      duration={toast.duration ?? 5000}
    >
      <div className="flex flex-col gap-1">
        <RadixToast.Title className="text-sm font-semibold">{toast.title}</RadixToast.Title>
        {toast.description && (
          <RadixToast.Description className="text-xs opacity-90">
            {toast.description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-black/5 dark:hover:bg-white/5 group-hover:opacity-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  return (
    <RadixToast.Provider swipeDirection="right" swipeThreshold={50}>
      {children}
      <RadixToast.Viewport className="fixed bottom-0 right-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </RadixToast.Provider>
  );
}
