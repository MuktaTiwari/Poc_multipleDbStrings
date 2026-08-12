import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PowerIcon from '@mui/icons-material/Power';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { connectionService } from '../services/api';
import { ConnectionContext } from '../App';
import { useNavigate } from 'react-router-dom';
import ConnectDatabase from '../components/ConnectDatabase';

interface SavedConnection {
  id: string;
  alias: string;
  uri: string;
  database: string;
}

const ConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { connectedDb, switchConnection } = React.useContext(ConnectionContext);
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  const fetchConnections = async () => {
    try {
      const res = await connectionService.listConnections();
      setConnections(res.data.connections);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [connectOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    try {
      await switchConnection(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Typography>Loading...</Typography>;
    }
    
    if (connections.length === 0) {
      return (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography color="textSecondary">
            No connections saved yet. Click "New Connection" to save a database URL.
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table aria-label="saved connections table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Alias</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Database Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>MongoDB URI</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {connections.map((conn) => (
              <TableRow key={conn.id} hover>
                <TableCell>{conn.alias || '-'}</TableCell>
                <TableCell>{conn.database}</TableCell>
                <TableCell>
                  <Box component="span" sx={{ 
                    fontFamily: 'monospace', 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    p: 1, 
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    display: 'inline-block'
                  }}>
                    {conn.uri}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Copy URI">
                    <IconButton onClick={() => handleCopy(conn.uri)}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  {connectedDb?.id === conn.id ? (
                    <Tooltip title="Currently Connected">
                      <IconButton color="success" disabled>
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Connect to Database">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleConnect(conn.id)}
                        disabled={connectingId === conn.id}
                      >
                        <PowerIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Saved Database Connections
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setConnectOpen(true)}
        >
          New Connection
        </Button>
      </Box>
      
      {renderContent()}

      <ConnectDatabase 
        open={connectOpen} 
        onClose={() => setConnectOpen(false)} 
        onConnected={fetchConnections} 
      />
    </Box>
  );
};

export default ConnectionsPage;
