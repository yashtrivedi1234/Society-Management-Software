import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../store/apiSlice';

const pageTitles = {
  '/': 'Dashboard',
  '/maintenance': 'Maintenance Collection',
  '/payments': 'Payment Records',
  '/expenses': 'Expense Management',
  '/members': 'Members Directory',
  '/ledger': 'Financial Ledger',
  '/notices': 'Notices & Announcements',
  '/complaints': 'Complaints & Helpdesk',
  '/visitors': 'Visitor Management',
  '/facilities': 'Facility Booking',
  '/operations': 'Operations & Security',
  '/finance-compliance': 'Finance & Compliance',
  '/governance': 'Governance Hub',
  '/product-settings': 'Product Settings',
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const panelRef = useRef(null);

  const hasAuthToken = Boolean(localStorage.getItem('auth_token'));
  const { data, isFetching, refetch } = useGetNotificationsQuery(undefined, {
    skip: !hasAuthToken,
    pollingInterval: 5000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const notificationData = data || { unreadCount: 0, items: [] };
  const notificationLoading = isFetching;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const pageTitle = location.pathname.startsWith('/invoice/')
    ? 'Invoice Details'
    : (pageTitles[location.pathname] || '');

  const hasUnread = notificationData.unreadCount > 0;
  const unreadLabel = notificationData.unreadCount > 99 ? '99+' : String(notificationData.unreadCount || 0);
  const groupedItems = useMemo(() => notificationData.items.slice(0, 8), [notificationData.items]);

  const closeNotifications = () => setNotificationOpen(false);

  const openNotifications = () => {
    setNotificationOpen(true);
    if (hasAuthToken) refetch();
  };

  // Notifications refresh via the RTK Query pollingInterval (5s), which authenticates with the
  // Authorization header (apiRequest). We intentionally do NOT use EventSource here: it cannot
  // send headers, which would force the JWT into the URL where it leaks into logs/history.

  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notificationOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeNotifications();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notificationOpen]);

  const notificationPanel = notificationOpen ? (
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close notifications"
        onClick={closeNotifications}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="absolute top-[4.25rem] left-3 right-3 max-h-[min(75vh,calc(100vh-5.5rem))] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col md:left-auto md:right-6 md:w-[22rem]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          <div className="flex items-center gap-2">
            {hasAuthToken && (
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"
                disabled={!hasUnread}
                onClick={async () => {
                  try {
                    await markAllRead().unwrap();
                  } catch {
                    // noop
                  }
                }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={closeNotifications}
              aria-label="Close notifications panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {!hasAuthToken ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">Sign in with live API to receive notifications.</p>
          ) : notificationLoading ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading...</p>
          ) : groupedItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
          ) : (
            groupedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  if (!item.read && hasAuthToken) {
                    try {
                      await markRead(item.id).unwrap();
                    } catch {
                      // noop
                    }
                  }
                  closeNotifications();
                  if (item.href) navigate(item.href);
                }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  item.read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {!item.read && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0" />}
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 min-h-10 min-w-10 rounded-lg text-teal-800/60 hover:bg-teal-50 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <h1 className="text-lg font-semibold text-teal-950 hidden sm:block tracking-tight">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden md:block text-sm text-teal-800/50 tabular-nums">{today}</span>

        <button
          type="button"
          className="relative p-2 min-h-10 min-w-10 rounded-lg text-teal-800/60 hover:bg-teal-50 transition-colors duration-200"
          aria-label={notificationOpen ? 'Close notifications' : 'Open notifications'}
          aria-expanded={notificationOpen}
          onClick={() => {
            if (notificationOpen) closeNotifications();
            else openNotifications();
          }}
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{unreadLabel}</span>
            </span>
          )}
        </button>

        {notificationPanel && createPortal(notificationPanel, document.body)}

        <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
