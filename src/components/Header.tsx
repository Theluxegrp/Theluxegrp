import { Sparkles, Lock } from 'lucide-react';

type HeaderProps = {
  onAdminAccess?: () => void;
};

export default function Header({ onAdminAccess }: HeaderProps) {
  const handleAdminClick = () => {
    if (onAdminAccess) {
      onAdminAccess();
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-900 via-blue-950 to-blue-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">The Luxe Grp</h1>
                <p className="text-sm text-slate-200 mt-0.5">Exclusive Event Experiences</p>
              </div>
            </div>
            <button
              onClick={handleAdminClick}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Admin</span>
            </button>
          </div>
        </div>
      </header>

    </>
  );
}
