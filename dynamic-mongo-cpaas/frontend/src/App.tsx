import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, AppBar, Toolbar, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { connectionService } from './services/api';
import CollectionPage from './pages/CollectionPage';
import ConnectionsPage from './pages/ConnectionsPage';
import DashboardPage from './pages/DashboardPage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LinkIcon from '@mui/icons-material/Link';
const drawerWidth = 240;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

export const ConnectionContext = createContext<{
  connectedDb: { database: string, alias: string, id: string } | null;
  switchConnection: (id: string) => Promise<void>;
}>({ connectedDb: null, switchConnection: async () => { } });

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [connectedDb, setConnectedDb] = useState<{ database: string, alias: string, id: string } | null>(null);
  //const [savedConnections, setSavedConnections] = useState<any[]>([]);

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

  const contextValue = React.useMemo(() => ({
    connectedDb,
    switchConnection: handleSwitchConnection
  }), [connectedDb]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dynamic CPaaS Database
          </Typography>
          {connectedDb ? (
            <Typography variant="body2" sx={{ mr: 2 }}>DB: {connectedDb.database}</Typography>
          ) : (
            <Typography variant="body2" sx={{ mr: 2 }} color="error">Not Connected</Typography>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2, mt: 2 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === '/'}
                onClick={() => navigate('/')}
                sx={{ borderRadius: 2, mb: 1 }}
              >
                <DashboardIcon sx={{ mr: 2, color: location.pathname === '/' ? 'primary.main' : 'inherit' }} />
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === '/connections'}
                onClick={() => navigate('/connections')}
                sx={{ borderRadius: 2 }}
              >
                <LinkIcon sx={{ mr: 2, color: location.pathname === '/connections' ? 'primary.main' : 'inherit' }} />
                <ListItemText primary="Connections" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <ConnectionContext.Provider value={contextValue}>
          {children}
        </ConnectionContext.Provider>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/collections/:collection" element={<CollectionPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
