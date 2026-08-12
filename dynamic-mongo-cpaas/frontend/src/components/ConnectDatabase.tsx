import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, CircularProgress, Typography } from '@mui/material';
import { connectionService } from '../services/api';

interface ConnectDatabaseProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

const ConnectDatabase: React.FC<ConnectDatabaseProps> = ({ open, onClose, onConnected }) => {
  const [mongoUri, setMongoUri] = useState('');
  const [database, setDatabase] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [collectionsFound, setCollectionsFound] = useState<number | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await connectionService.testConnection(mongoUri, database);
      setSuccess('Connected successfully');
      setCollectionsFound(res.data.collections.length);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await connectionService.connect(mongoUri, database, alias);
      onConnected();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect MongoDB</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="MongoDB URI"
          value={mongoUri}
          onChange={e => setMongoUri(e.target.value)}
          disabled={loading}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Connection Alias (e.g., Prod DB)"
          value={alias}
          onChange={e => setAlias(e.target.value)}
          disabled={loading}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Database Name"
          value={database}
          onChange={e => setDatabase(e.target.value)}
          disabled={loading}
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">{success}</Typography>
            <Typography variant="body2">Database: {database}</Typography>
            <Typography variant="body2">Collections found: {collectionsFound}</Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleTest} disabled={loading} color="secondary">
          {loading ? <CircularProgress size={24} /> : 'Test Connection'}
        </Button>
        <Button onClick={handleConnect} disabled={loading} variant="contained" color="primary">
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectDatabase;
