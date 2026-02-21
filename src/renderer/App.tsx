import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initializeTheme } from './stores';
import { MainLayout } from './components/layout';
import {
  Home,
  Parks,
  ParkDetail,
  Plans,
  PlanDetail,
  NewPlan,
  Settings,
} from './pages';

export function App(): JSX.Element {
  useEffect(() => {
    initializeTheme();
  }, []);

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
