// src/components/Navbar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircle,
  LogOut,
  LogIn,
  Mail,
  CreditCard,
  Cpu,
  LineChart,
  Settings,
  Menu,
  X,
  BarChart2,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/authThunks';
import ThemeToggle from './ThemeToggle';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  hasDropdown?: boolean;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: UserCircle, path: '/dashboard' },
  { id: 'trading', label: 'Trading', icon: LineChart, path: '/trading' },
  { id: 'portfolios', label: 'Portfolios', icon: BarChart2, path: '/portfolio' },
  { id: 'brokers', label: 'Brokers', icon: Cpu, path: '/brokers' }, 
  { id: 'payments', label: 'Payments', icon: CreditCard, path: '/plans', hasDropdown: true },
  { id: 'referrals', label: 'Refer & Earn', icon: Mail, path: '/referrals' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const paymentsMenu = [
  { label: 'Subscription Plans', path: '/plans' },
  { label: 'My Subscriptions', path: '/subscriptions' },
  { label: 'Payouts', path: '/payouts' },
  { label: 'Stripe Connect', path: '/stripe-connect' },
];

const NAV_DROPDOWN_STYLE =
  'absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 border border-gray-100 dark:border-gray-700 z-50 overflow-hidden';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [openDropdown, setOpenDropdown] = useState<'payments' | 'profile' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState<'payments' | 'profile' | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const paymentsRef = useRef<HTMLButtonElement | null>(null);
  const profileRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const isPaymentPage = [
      '/plans',
      '/checkout',
      '/payouts',
      '/subscriptions',
      '/stripe-connect',
      '/payment-result',
    ].some((p) => currentPath.startsWith(p));

    if (isPaymentPage) setActiveTab('payments');
    else {
      const found = navItems.find((n) => n.path && currentPath.startsWith(n.path));
      setActiveTab(found?.id ?? 'dashboard');
    }
  }, [location.pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setMobileSubOpen(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
        setMobileSubOpen(null);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpenDropdown(null);
    setMobileOpen(false);
    setMobileSubOpen(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const getEmailInitial = (email?: string) => (email ? email.trim().charAt(0).toUpperCase() : '?');

  return (
    <nav
      ref={rootRef}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* LEFT: Logo */}
          <div className="flex items-center">
            <div
              onClick={() => handleNavigation('/')}
              className="flex items-baseline cursor-pointer select-none"
              aria-label="Go to Dashboard"
            >
              <span className="text-2xl font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors">
                Matrix
              </span>
              <span className="ml-1 text-2xl font-medium text-gray-700 dark:text-gray-300">Trading</span>
            </div>

            <div className="ml-8" />

            {/* Desktop nav items */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map(({ id, label, icon: Icon, path, hasDropdown }) => {
                  const isActive = activeTab === id;
                  const onClick = () => {
                    if (hasDropdown) {
                      setOpenDropdown((prev) => (prev === id ? null : (id as any)));
                    } else if (path) {
                      handleNavigation(path);
                    }
                  };

                  return (
                    <div key={id} className="relative">
                      <button
                        ref={id === 'payments' ? paymentsRef : undefined}
                        onClick={onClick}
                        aria-expanded={openDropdown === id}
                        aria-haspopup={hasDropdown ? 'menu' : undefined}
                        className={`px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-all ${
                          isActive
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="whitespace-nowrap">{label}</span>
                        {hasDropdown && <ChevronDown className="w-3.5 h-3.5 opacity-80 ml-0.5" />}
                      </button>

                      {/* Payments dropdown */}
                      {id === 'payments' && openDropdown === 'payments' && (
                        <div className={NAV_DROPDOWN_STYLE} role="menu" aria-label="Payments menu">
                          <div className="py-1">
                            {paymentsMenu.map((m) => (
                              <button
                                key={m.path}
                                onClick={() => handleNavigation(m.path)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* RIGHT: Theme + Auth/Profile */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Profile Button */}
                <div className="relative">
                  <button
                    ref={profileRef}
                    onClick={() => setOpenDropdown((p) => (p === 'profile' ? null : 'profile'))}
                    aria-expanded={openDropdown === 'profile'}
                    aria-haspopup="menu"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:scale-105 transition-transform"
                    title={user?.email ?? 'Profile'}
                  >
                    {getEmailInitial(user?.email)}
                  </button>

                  {openDropdown === 'profile' && (
                    <div className={`${NAV_DROPDOWN_STYLE} right-0 left-auto`} role="menu" aria-label="Profile menu">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <UserCircle className="w-4 h-4 mr-2" /> Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ml-1"
                  onClick={() => {
                    setMobileOpen((prev) => !prev);
                    setOpenDropdown(null);
                    setMobileSubOpen(null);
                  }}
                  aria-expanded={mobileOpen}
                  aria-label="Toggle mobile menu"
                >
                  {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3 py-1 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="py-2 space-y-1">
            {navItems.map(({ id, label, icon: Icon, path, hasDropdown }) => {
              const isActive = activeTab === id;

              if (hasDropdown) {
                return (
                  <div key={id} className="px-3">
                    <button
                      onClick={() => setMobileSubOpen((p) => (p === id ? null : (id as any)))}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-left text-sm font-medium transition ${
                        isActive
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      aria-expanded={mobileSubOpen === id}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transform ${mobileSubOpen === id ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {mobileSubOpen === id && (
                      <div className="mt-1 ml-6 bg-transparent rounded-md overflow-hidden">
                        {paymentsMenu.map((s) => (
                          <button
                            key={s.path}
                            onClick={() => handleNavigation(s.path)}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={id}
                  onClick={() => path && handleNavigation(path)}
                  className={`flex items-center w-full px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
