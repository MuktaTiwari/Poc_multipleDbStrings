import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, TextField, 
  IconButton, CircularProgress, Drawer, List, ListItem, Divider
} from '@mui/material';
import { Edit, Delete, Refresh, Info as InfoIcon } from '@mui/icons-material';
import { collectionService, documentService } from '../services/api';
import DocumentForm from '../components/DocumentForm';
import FieldTypeBadge from '../components/FieldTypeBadge';
import { ConnectionContext } from '../App';

interface Field {
  name: string;
  type: string;
  children?: Field[];
}

const CollectionPage: React.FC = () => {
  const { collection } = useParams<{ collection: string }>();
  const { connectedDb } = useContext(ConnectionContext);
  const [fields, setFields] = useState<Field[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const loadData = async () => {
    if (!collection) return;
    setLoading(true);
    try {
      const [schemaRes, docsRes] = await Promise.all([
        collectionService.getSchema(collection),
        documentService.list(collection, 1, 25, search)
      ]);
      setFields(schemaRes.data.fields);
      setDocuments(docsRes.data.documents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collection, search, connectedDb?.id]);

  const handleCreate = () => {
    setEditingDoc(null);
    setFormOpen(true);
  };

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!collection) return;
    if (window.confirm('Are you sure you want to delete this document?')) {
      await documentService.delete(collection, id);
      loadData();
    }
  };

  const handleSave = async (docData: any) => {
    if (!collection) return;
    
    // Parse strings that should be JSON if they were typed as strings
    const processedData = { ...docData };
    fields.forEach(f => {
       if ((f.type === 'object' || f.type === 'array') && typeof processedData[f.name] === 'string') {
         try {
           processedData[f.name] = JSON.parse(processedData[f.name]);
         } catch (e) {
           // Keep as string if invalid, or ignore
         }
       }
    });

    if (editingDoc) {
      await documentService.update(collection, editingDoc._id, processedData);
    } else {
      await documentService.create(collection, processedData);
    }
    setFormOpen(false);
    loadData();
  };

  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (!collection) return <Typography>No collection selected</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{textTransform: 'capitalize'}}>{collection}</Typography>
        <Box>
          <Button startIcon={<InfoIcon />} onClick={() => setSchemaOpen(true)} sx={{ mr: 2 }}>
            Schema Info
          </Button>
          <Button startIcon={<Refresh />} onClick={loadData} sx={{ mr: 2 }}>Refresh</Button>
          <Button variant="contained" color="primary" onClick={handleCreate}>+ Add Document</Button>
        </Box>
      </Box>


      <Box sx={{ mb: 2 }}>
        <TextField 
          label="Search documents..." 
          variant="outlined" 
          size="small" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {fields.filter(f => f.name !== '_id').map(f => (
                  <TableCell key={f.name}>{f.name}</TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map(doc => (
                <TableRow key={doc._id}>
                  {fields.filter(f => f.name !== '_id').map(f => (
                    <TableCell key={f.name}>{renderCellValue(doc[f.name])}</TableCell>
                  ))}
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(doc)}><Edit /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(doc._id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={fields.length + 1} align="center">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DocumentForm 
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        fields={fields}
        initialData={editingDoc}
        title={editingDoc ? 'Edit Document' : 'Create Document'}
      />

      <Drawer anchor="right" open={schemaOpen} onClose={() => setSchemaOpen(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Collection Schema
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Dynamically inferred from the latest documents in the collection.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {fields.map(f => (
              <ListItem key={f.name} disablePadding sx={{ mb: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{f.name}</Typography>
                    <FieldTypeBadge type={f.type} />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Detected as {f.type}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CollectionPage;
