import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-teal-50/50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-3 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow"
      >
        Skip to main content
      </a>
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
