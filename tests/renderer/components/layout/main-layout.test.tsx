import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../../src/renderer/components/layout/main-layout';
import { useUIStore } from '../../../../src/renderer/stores/ui-store';

const closeShortcutsDialogMock = vi.fn();

vi.mock('../../../../src/renderer/hooks/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: () => ({
    shortcutsDialogOpen: true,
    closeShortcutsDialog: closeShortcutsDialogMock,
    openShortcutsDialog: vi.fn(),
    toggleShortcutsDialog: vi.fn(),
    shortcuts: [],
  }),
}));

vi.mock('../../../../src/renderer/components/layout/header', () => ({
  Header: ({ sidebarOpen, onToggleSidebar }: { sidebarOpen: boolean; onToggleSidebar: () => void }) => (
    <button type="button" onClick={onToggleSidebar}>
      {sidebarOpen ? 'header-open' : 'header-closed'}
    </button>
  ),
}));

vi.mock('../../../../src/renderer/components/layout/sidebar', () => ({
  Sidebar: ({ isOpen }: { isOpen: boolean }) => <div>sidebar-{String(isOpen)}</div>,
}));

vi.mock('../../../../src/renderer/components/ui/shortcuts-dialog', () => ({
  ShortcutsDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <button type="button" onClick={() => onOpenChange(false)}>
      {open ? 'shortcuts-open' : 'shortcuts-closed'}
    </button>
  ),
}));

describe('renderer/components/layout/main-layout', () => {
  beforeEach(() => {
    try {
      useUIStore.persist?.clearStorage?.();
    } catch {
      // Ignore storage cleanup issues in restricted jsdom environments.
    }
    useUIStore.setState({
      theme: 'system',
      resolvedTheme: 'light',
      sidebarOpen: true,
      sidebarWidth: 256,
      isGlobalLoading: false,
      loadingMessage: '',
      toasts: [],
    });
    closeShortcutsDialogMock.mockReset();
  });

  it('renders outlet content and toggles sidebar layout spacing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<div>Outlet page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Outlet page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('pl-64');
    expect(screen.getByText('sidebar-true')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'header-open' }));

    expect(screen.getByRole('main')).toHaveClass('pl-0');
    expect(screen.getByText('sidebar-false')).toBeInTheDocument();
  });

  it('closes shortcuts dialog when onOpenChange(false) is emitted', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<div>Outlet page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'shortcuts-open' }));
    expect(closeShortcutsDialogMock).toHaveBeenCalledTimes(1);
  });
});
