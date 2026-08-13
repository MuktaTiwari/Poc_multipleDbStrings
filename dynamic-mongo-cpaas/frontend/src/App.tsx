import React, { useState, useEffect, useCallback, createContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Link2, LogOut, DatabaseZap, ChevronDown, Check, Settings, Loader2 } from 'lucide-react';
import { connectionService } from './services/api';
import CollectionPage from './pages/CollectionPage';
import ConnectionsPage from './pages/ConnectionsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequireAuth from './components/RequireAuth';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import { cn } from './lib/utils';

interface SavedConnection {
  id: string;
  alias: string;
  database: string;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/connections', label: 'Connections', icon: Link2 },
];

export const ConnectionContext = createContext<{
  connectedDb: { database: string; alias: string; id: string } | null;
  switchConnection: (id: string) => Promise<void>;
}>({ connectedDb: null, switchConnection: async () => {} });

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [connectedDb, setConnectedDb] = useState<{ database: string; alias: string; id: string } | null>(null);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const checkStatus = async () => {
    try {
      const res = await connectionService.getStatus();
      if (res.data.connected) {
        setConnectedDb({ database: res.data.database, alias: res.data.alias, id: res.data.id });
      } else {
        setConnectedDb(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedConnections = useCallback(async () => {
    try {
      const res = await connectionService.listConnections();
      setSavedConnections(res.data.connections);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSwitchConnection = async (id: string) => {
    setSwitchingId(id);
    try {
      await connectionService.switchConnection(id);
      await checkStatus();
      if (location.pathname.startsWith('/collections/')) {
        navigate('/');
      }
      setIsDropdownOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingId(null);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [location.pathname]);

  useEffect(() => {
    loadSavedConnections();
  }, [loadSavedConnections, connectedDb?.id]);

  const contextValue = React.useMemo(
    () => ({
      connectedDb,
      switchConnection: handleSwitchConnection,
    }),
    [connectedDb],
  );

  return (
    <div className="flex min-h-svh">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground">
            <DatabaseZap className="size-4" />
          </span>
          Dynamic CPaaS Database
        </span>
        <div className="flex items-center gap-3 text-sm">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  connectedDb
                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive hover:bg-destructive/25',
                )}
              >
                {connectedDb ? `DB: ${connectedDb.database}` : 'Not connected'}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {savedConnections.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved connections yet</div>
              ) : (
                savedConnections.map((conn) => {
                  const isActive = connectedDb?.id === conn.id;
                  return (
                    <DropdownMenuItem
                      key={conn.id}
                      disabled={isActive || switchingId === conn.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSwitchConnection(conn.id);
                      }}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{conn.alias || conn.database}</span>
                        <span className="truncate text-xs text-muted-foreground">{conn.database}</span>
                      </span>
                      {switchingId === conn.id ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      ) : isActive ? (
                        <Check className="size-3.5 shrink-0 text-emerald-500" />
                      ) : null}
                    </DropdownMenuItem>
                  );
                })
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/connections')} className="gap-2">
                <Settings className="size-3.5" />
                Manage connections
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && <span className="text-muted-foreground">{user.email}</span>}
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 w-60 border-r bg-background pt-14">
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-primary-foreground' : 'text-foreground hover:bg-accent',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 size-4" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="ml-60 min-w-0 flex-1 pt-14">
        <div className="min-w-0 p-6">
          <ConnectionContext.Provider value={contextValue}>{children}</ConnectionContext.Provider>
        </div>
      </main>
    </div>
  );
};

const AppShell: React.FC = () => (
  <RequireAuth>
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/collections/:collection" element={<CollectionPage />} />
      </Routes>
    </Layout>
  </RequireAuth>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
