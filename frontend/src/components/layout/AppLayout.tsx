import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FolderKanban, CheckSquare, Users, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

const navItems = [
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/users', icon: Users, label: 'Users' },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the drawer when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logging out locally matters more than the server call succeeding
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] bg-background">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(85vw,16rem)] flex flex-col border-r bg-card',
          'transform transition-transform duration-200 ease-in-out md:static md:z-auto md:w-56 md:translate-x-0 md:shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-4 py-4 border-b flex items-center justify-between md:px-5">
          <span className="text-lg font-bold text-primary">theWoman CRM</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex md:hidden items-center gap-3 border-b bg-card px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-primary truncate">
            {navItems.find((item) => location.pathname.startsWith(item.to))?.label ??
              'theWoman CRM'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
