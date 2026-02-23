import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../stores';
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { ToastProvider } from '../ui/toast';
import { ShortcutsDialog } from '../ui/shortcuts-dialog';

export function MainLayout(): JSX.Element {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { shortcutsDialogOpen, closeShortcutsDialog } = useKeyboardShortcuts();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`min-h-screen pt-16 transition-all duration-200 ease-in-out ${
            sidebarOpen ? 'pl-64' : 'pl-0'
          }`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
        <ShortcutsDialog open={shortcutsDialogOpen} onOpenChange={(open) => {
          if (!open) closeShortcutsDialog();
        }} />
      </div>
    </ToastProvider>
  );
}
