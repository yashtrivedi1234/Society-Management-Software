import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  CreditCard,
  Receipt,
  Users,
  BookOpen,
  LogOut,
  X,
  Bell,
  MessageSquareWarning,
  UserCheck,
  CalendarDays,
  Building2,
  ShieldCheck,
  Landmark,
  Vote,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import societyConfig from '../../config/society';

const navSections = [
  {
    label: null,
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'accountant'] },
      { to: '/my-flat', label: 'My Flat', icon: Home, roles: ['member'] },
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'Collections',
    links: [
      { to: '/maintenance', label: 'Maintenance', icon: Home, roles: ['admin', 'accountant'] },
      { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'Finance',
    links: [
      { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'accountant'] },
      { to: '/ledger', label: 'Ledger', icon: BookOpen, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'Community',
    links: [
      { to: '/members', label: 'Members', icon: Users, roles: ['admin', 'accountant'] },
      { to: '/visitors', label: 'Visitors', icon: UserCheck, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/notices', label: 'Notices', icon: Bell, roles: ['admin', 'accountant', 'member'] },
      { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: null,
    links: [
      { to: '/facilities', label: 'Facility Booking', icon: CalendarDays, roles: ['admin', 'accountant'] },
      { to: '/operations', label: 'Operations', icon: ShieldCheck, roles: ['admin', 'accountant'] },
      { to: '/finance-compliance', label: 'Finance Compliance', icon: Landmark, roles: ['admin', 'accountant'] },
      { to: '/governance', label: 'Governance', icon: Vote, roles: ['admin', 'accountant'] },
    ],
  },
];

function SidebarContent({ onClose, isMobile }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'member';

  return (
    <>
      {/* Brand section */}
      <div className="px-5 py-5 border-b border-teal-100/80 bg-gradient-to-br from-teal-50/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-700 rounded-lg flex items-center justify-center shadow-sm shadow-teal-700/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-teal-950 leading-tight">
                {societyConfig.productName}
              </h1>
              <p className="text-[10px] text-teal-700/55 leading-tight">{societyConfig.name}</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navSections.map((section, sIdx) => {
          const visibleLinks = section.links.filter((link) => !link.roles || link.roles.includes(role));
          if (visibleLinks.length === 0) return null;
          return (
          <div key={sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {visibleLinks.map((link) => {
                const LinkIcon = link.icon;
                return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 min-h-10 rounded-lg text-[13px] font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_0_#0f766e]'
                        : 'text-gray-600 hover:bg-teal-50/60 hover:text-teal-950'
                    }`
                  }
                >
                  <LinkIcon className="w-[18px] h-[18px] flex-shrink-0" />
                  {link.label}
                </NavLink>
                );
              })}
            </div>
          </div>
        )})}
      </nav>

      {/* User section */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : user?.role === 'accountant'
                    ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {user?.role === 'admin' ? 'Admin' : user?.role === 'accountant' ? 'Accountant' : 'Member'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay + drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-teal-100 flex flex-col transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent onClose={onClose} isMobile={true} />
      </aside>

      {/* Desktop sidebar — static within flex layout, not fixed */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-teal-100 flex-col">
        <SidebarContent onClose={onClose} isMobile={false} />
      </aside>
    </>
  );
}
