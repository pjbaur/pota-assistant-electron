import type { ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  className = '',
}: SelectProps<T>): JSX.Element {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
            {selectedOption?.label ?? placeholder}
          </span>
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
            className="ml-2 text-slate-400"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg border border-slate-200 bg-white p-1 shadow-lg animate-fade-in dark:border-slate-700 dark:bg-slate-800"
            sideOffset={4}
          >
            {options.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                disabled={option.disabled ?? false}
                className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none transition-colors ${
                  option.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:bg-slate-700'
                } ${value === option.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : ''}`}
                onSelect={(event) => {
                  event.preventDefault();
                  if (!option.disabled) {
                    onChange(option.value);
                  }
                }}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
