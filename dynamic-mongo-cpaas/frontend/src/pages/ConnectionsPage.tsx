import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { connectionService } from '../services/api';

interface SavedConnection {
  id: string;
  alias: string;
  uri: string;
  database: string;
}

const ConnectionsPage: React.FC = () => {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchConnections();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Saved MongoDB URLs
      </Typography>
      
      {loading ? (
        <Typography>Loading...</Typography>
      ) : connections.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography color="textSecondary">
            No connections saved yet. Click "+ Connect" in the sidebar to save a database URL.
          </Typography>
        </Paper>
      ) : (
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ConnectionsPage;
