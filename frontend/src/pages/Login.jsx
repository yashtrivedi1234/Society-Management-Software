import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  FileText,
  Users,
  Shield,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import societyConfig from '../config/society';
import { isLiveMode } from '../config/appMode';

const features = [
  { icon: BarChart3, title: 'Finance dashboard', desc: 'Collections, expenses, pending dues & net balance' },
  { icon: FileText, title: 'Maintenance & invoices', desc: 'Monthly bills, payment tracking & WhatsApp reminders' },
  { icon: Users, title: 'Members & visitors', desc: 'Flat directory, guest entry & domestic help logs' },
  { icon: Shield, title: 'Complaints & ops', desc: 'Helpdesk tickets, staff, parking & security alerts' },
  { icon: MessageSquare, title: 'Notices & governance', desc: 'Announcements, polls, meetings & RSVPs' },
  { icon: CalendarDays, title: 'Facility booking', desc: 'Clubhouse, sports courts & amenity slots' },
];

const liveDemoAccounts = [
  { role: 'Admin', username: 'admin@greenvalley.demo', password: 'Admin@123', hint: 'Full RWA control' },
  { role: 'Accountant', username: 'accountant@greenvalley.demo', password: 'Account@123', hint: 'Finance focus' },
  { role: 'Member', username: 'member@greenvalley.demo', password: 'Member@123', hint: 'Resident portal' },
];

const offlineDemoAccounts = [
  { role: 'Admin', username: 'demo-admin', password: 'demo', hint: 'Full RWA control' },
  { role: 'Member', username: 'demo-member', password: 'demo', hint: 'Resident portal' },
];

export default function Login() {
  const accounts = isLiveMode ? liveDemoAccounts : offlineDemoAccounts;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const fillAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 500));

    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh bg-teal-50/40">
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-800 to-sky-900">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.35), transparent 42%), radial-gradient(circle at 80% 70%, rgba(3,105,161,0.45), transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12 xl:px-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-teal-100">
              Sample society · {societyConfig.name}
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold tracking-tight text-white leading-none">
                  {societyConfig.productName}
                </p>
                <p className="mt-2 text-teal-100/90 text-base">{societyConfig.productTagline}</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-teal-100/75">
              Software for residential societies and RWAs — collect maintenance, track expenses,
              manage visitors, resolve complaints, and keep residents informed from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xl mt-10">
            {features.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-[2px] transition-colors duration-200 hover:bg-white/10"
                >
                  <FeatureIcon className="w-5 h-5 text-teal-200 mb-2.5" />
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="mt-1 text-teal-100/70 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 max-w-xl rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200/80 mb-2">
              What to explore in this demo
            </p>
            <ol className="space-y-1.5 text-xs text-teal-100/75 list-decimal list-inside leading-relaxed">
              <li><span className="text-white font-medium">Admin</span> — dashboard, maintenance collection, members, visitors</li>
              <li><span className="text-white font-medium">Accountant</span> — expenses, ledger, payments, reports</li>
              <li><span className="text-white font-medium">Member</span> — My Flat portal, notices, raise complaints</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fadeIn">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-700/20 mb-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-xl font-bold text-teal-950">{societyConfig.productName}</p>
            <p className="text-sm text-teal-700/70">{societyConfig.productTagline}</p>
          </div>

          <h1 className="text-2xl font-bold text-teal-950 text-center lg:text-left">
            Sign in to the demo
          </h1>
          <p className="text-sm text-teal-800/60 text-center lg:text-left mt-1 mb-5">
            Managing sample data for {societyConfig.name}
          </p>

          <div className="mb-5 rounded-xl border border-teal-200/80 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700/60 mb-2">
              Try a role
            </p>
            <div className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillAccount(account)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-left transition-colors hover:bg-teal-100"
                >
                  <span className="text-sm font-semibold text-teal-900">{account.role}</span>
                  <span className="text-[11px] text-teal-700/70">{account.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${shake ? 'animate-shake' : ''}`}
          >
            <div>
              <label htmlFor="login-identity" className="block text-sm font-medium text-teal-900 mb-1.5">
                {isLiveMode ? 'Email' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-teal-600/40" />
                </div>
                <input
                  id="login-identity"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isLiveMode ? 'admin@greenvalley.demo' : 'demo-admin'}
                  autoComplete={isLiveMode ? 'email' : 'username'}
                  required
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 bg-white border border-teal-200 rounded-lg text-sm text-teal-950 placeholder:text-teal-700/35 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-teal-900 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-teal-600/40" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full min-h-11 pl-10 pr-10 py-2.5 bg-white border border-teal-200 rounded-lg text-sm text-teal-950 placeholder:text-teal-700/35 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-600/50 hover:text-teal-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-70 shadow-sm shadow-teal-700/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Enter demo'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
