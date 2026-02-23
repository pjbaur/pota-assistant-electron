import { Dialog, DialogContent } from './dialog';
import { DEFAULT_SHORTCUTS } from '../../hooks/use-keyboard-shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatShortcut(shortcut: (typeof DEFAULT_SHORTCUTS)[number]): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? '⌘' : 'Ctrl';

  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(ctrlKey);
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Keyboard Shortcuts" className="max-w-lg">
        <div className="space-y-2">
          {DEFAULT_SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {shortcut.description}
              </span>
              <kbd className="rounded bg-slate-200 px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
