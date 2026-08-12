import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, Paper,Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Grid } from '@mui/material';
import { ConnectionContext } from '../App';
import { collectionService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import StorageIcon from '@mui/icons-material/Storage';
import AddIcon from '@mui/icons-material/Add';

const DashboardPage: React.FC = () => {
  const { connectedDb } = useContext(ConnectionContext);
  const navigate = useNavigate();
  const [collections, setCollections] = useState<{name: string}[]>([]);
  const [createColOpen, setCreateColOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  const loadCollections = async () => {
    if (!connectedDb) return;
    try {
      const res = await collectionService.list();
      setCollections(res.data.collections);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [connectedDb]);

  const handleCreateCollection = async () => {
    if (!newColName) return;
    try {
      await collectionService.create(newColName);
      setNewColName('');
      setCreateColOpen(false);
      loadCollections();
    } catch (err) {
      console.error(err);
    }
  };

  if (!connectedDb) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <StorageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="textSecondary" gutterBottom>
          No Active Database Connection
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Please connect to a database to view and manage collections.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/connections')}>
          Go to Connections
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon fontSize="large" color="primary" />
            Database: {connectedDb.database}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your collections and schemas dynamically.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreateColOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          New Collection
        </Button>
      </Box>

      {collections.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            This database is empty.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Create your first collection to start storing data.
          </Typography>
          <Button variant="outlined" onClick={() => setCreateColOpen(true)}>Create Collection</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {collections.map((col) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={col.name}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onClick={() => navigate(`/collections/${col.name}`)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(144, 202, 249, 0.1)' }}>
                      <StorageIcon color="primary" />
                    </Box>
                    <Typography variant="h6">{col.name}</Typography>
                  </Box>
                  <ArrowForwardIosIcon fontSize="small" color="action" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createColOpen} onClose={() => setCreateColOpen(false)}>
        <DialogTitle>Create New Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            variant="outlined"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateColOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCollection} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
