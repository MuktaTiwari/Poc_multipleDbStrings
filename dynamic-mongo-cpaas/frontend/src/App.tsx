import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Link2, LogOut } from 'lucide-react';
import { connectionService } from './services/api';
import CollectionPage from './pages/CollectionPage';
import ConnectionsPage from './pages/ConnectionsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequireAuth from './components/RequireAuth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

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

  const handleSwitchConnection = async (id: string) => {
    try {
      await connectionService.switchConnection(id);
      checkStatus();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [location.pathname]);

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
        <span className="text-lg font-semibold">Dynamic CPaaS Database</span>
        <div className="flex items-center gap-3 text-sm">
          {connectedDb ? (
            <span className="text-muted-foreground">DB: {connectedDb.database}</span>
          ) : (
            <span className="text-destructive">Not connected</span>
          )}
          {user && <span className="text-muted-foreground">{user.email}</span>}
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

      <main className="ml-60 flex-1 pt-14">
        <div className="p-6">
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
  );
};

export default App;
