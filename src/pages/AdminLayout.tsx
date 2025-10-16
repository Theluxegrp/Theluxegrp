import { ReactNode } from 'react';
import { Calendar, Settings, LogOut, Sparkles, Users } from 'lucide-react';
import { signOut } from '../lib/auth';

type AdminLayoutProps = {
  children: ReactNode;
  currentPage: 'events' | 'settings' | 'guestlist';
  onNavigate: (page: 'events' | 'settings' | 'guestlist') => void;
  onLogout: () => void;
};

export default function AdminLayout({ children, currentPage, onNavigate, onLogout }: AdminLayoutProps) {
  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const navItems = [
    { id: 'events' as const, label: 'Events', icon: Calendar },
    { id: 'guestlist' as const, label: 'Guest Lists', icon: Users },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-900 via-blue-950 to-blue-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-7 h-7 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold">The Luxe Grp</h1>
                <p className="text-xs text-slate-200">Admin Portal</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="bg-white rounded-xl shadow-md mb-6 p-2">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-yellow-500 text-slate-900 shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
