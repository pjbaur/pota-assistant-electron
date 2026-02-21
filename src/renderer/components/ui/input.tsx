import React, { forwardRef } from 'react';

export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<InputVariant, string> = {
  default:
    'border-slate-300 dark:border-slate-600 focus:border-primary-500 focus:ring-primary-500',
  error:
    'border-error-500 focus:border-error-500 focus:ring-error-500 text-error-600 dark:text-error-400',
  success:
    'border-success-500 focus:border-success-500 focus:ring-success-500',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    variant = 'default',
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
  },
  ref
): JSX.Element {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const baseInputStyles =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${variantStyles[variant]} ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {helperText && (
        <p
          className={`mt-1 text-xs ${
            variant === 'error'
              ? 'text-error-600 dark:text-error-400'
              : variant === 'success'
                ? 'text-success-600 dark:text-success-400'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
