import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Button, AppBar, Toolbar, CssBaseline, ThemeProvider, createTheme, Select, MenuItem, FormControl } from '@mui/material';
import { connectionService, collectionService } from './services/api';
import ConnectDatabase from './components/ConnectDatabase';
import CollectionPage from './pages/CollectionPage';
import ConnectionsPage from './pages/ConnectionsPage';
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
  connectedDb: {database: string, alias: string, id: string} | null;
}>({ connectedDb: null });

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [connectOpen, setConnectOpen] = useState(false);
  const [collections, setCollections] = useState<{name: string}[]>([]);
  const [connectedDb, setConnectedDb] = useState<{database: string, alias: string, id: string} | null>(null);
  const [savedConnections, setSavedConnections] = useState<any[]>([]);

  const checkStatus = async () => {
    try {
      const res = await connectionService.getStatus();
      if (res.data.connected) {
        setConnectedDb({ database: res.data.database, alias: res.data.alias, id: res.data.id });
        loadCollections();
      } else {
        setConnectedDb(null);
        setCollections([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCollections = async () => {
    try {
      const res = await collectionService.list();
      setCollections(res.data.collections);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedConnections = async () => {
    try {
      const res = await connectionService.listConnections();
      setSavedConnections(res.data.connections);
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
    loadSavedConnections();
  }, [connectOpen]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dynamic CPaaS Database
          </Typography>
          {savedConnections.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
              <Select
                value={connectedDb ? connectedDb.id : ''}
                displayEmpty
                onChange={(e) => handleSwitchConnection(e.target.value as string)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' } }}
              >
                <MenuItem value="" disabled>Select Connection...</MenuItem>
                {savedConnections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>{conn.alias || conn.database}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="overline" color="textSecondary">Collections</Typography>
          <List>
            {collections.map((col) => (
              <ListItem key={col.name} disablePadding>
                <ListItemButton 
                  selected={location.pathname === `/collections/${col.name}`}
                  onClick={() => navigate(`/collections/${col.name}`)}
                >
                  <ListItemText primary={col.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Button 
            variant="outlined" 
            fullWidth 
            sx={{ mt: 2 }}
            onClick={() => setConnectOpen(true)}
          >
            + Connect
          </Button>
          <Button 
            variant="text" 
            fullWidth 
            sx={{ mt: 1 }}
            onClick={() => navigate('/connections')}
          >
            View Saved URLs
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <ConnectionContext.Provider value={{ connectedDb }}>
          {children}
        </ConnectionContext.Provider>
      </Box>
      <ConnectDatabase 
        open={connectOpen} 
        onClose={() => setConnectOpen(false)} 
        onConnected={checkStatus} 
      />
    </Box>
  );
};

const Dashboard = () => (
  <Typography variant="h5">Welcome to Dynamic CPaaS. Please connect a database or select a collection.</Typography>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/collections/:collection" element={<CollectionPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
