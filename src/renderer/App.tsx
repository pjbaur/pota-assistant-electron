import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initializeTheme } from './stores';
import { MainLayout } from './components/layout';
import { WelcomeScreen } from './components/onboarding';
import { useFirstRun } from './hooks';
import {
  Home,
  Parks,
  ParkDetail,
  Plans,
  PlanDetail,
  NewPlan,
  Settings,
} from './pages';

/** Simple loading screen shown while checking first-run status */
function LoadingScreen(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

export function App(): JSX.Element {
  const { isFirstRun, isLoading, completeOnboarding } = useFirstRun();

  useEffect(() => {
    initializeTheme();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isFirstRun) {
    return <WelcomeScreen onComplete={completeOnboarding} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/parks" element={<Parks />} />
          <Route path="/parks/:id" element={<ParkDetail />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/new" element={<NewPlan />} />
          <Route path="/plans/:id" element={<PlanDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
