import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function Home(): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome to POTA Activation Planner
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Plan your Parks on the Air activations with ease.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          title="Discover Parks"
          description="Search and explore POTA parks by location, name, or reference number."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          link="/parks"
          linkText="Browse Parks"
        />

        <QuickActionCard
          title="Create Activation Plan"
          description="Build a detailed activation plan with weather forecasts and band recommendations."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          }
          link="/plans/new"
          linkText="Start Planning"
        />

        <QuickActionCard
          title="View My Plans"
          description="Review and manage your saved activation plans."
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
          link="/plans"
          linkText="View Plans"
        />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Getting Started
        </h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              1
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">
                Search for Parks
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Find parks by name, reference (e.g., K-0039), or location.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              2
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">
                Create a Plan
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Use the planning wizard to schedule your activation with equipment presets and band conditions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              3
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">
                Go Activate!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Take your plan to the field and make contacts!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

function QuickActionCard({
  title,
  description,
  icon,
  link,
  linkText,
}: QuickActionCardProps): JSX.Element {
  return (
    <div className="card flex flex-col">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="mt-4">
        <Link to={link}>
          <Button variant="secondary" size="sm">
            {linkText}
          </Button>
        </Link>
      </div>
    </div>
  );
}
