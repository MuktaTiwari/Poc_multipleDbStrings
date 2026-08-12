import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2, RefreshCw, Info, Plus, Loader2, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { collectionService, documentService } from '../services/api';
import DocumentForm from '../components/DocumentForm';
import FieldTypeBadge from '../components/FieldTypeBadge';
import { ConnectionContext } from '../App';

interface Field {
  name: string;
  type: string;
  children?: Field[];
}

const SEARCH_DEBOUNCE_MS = 300;

const CollectionPage: React.FC = () => {
  const { collection } = useParams<{ collection: string }>();
  const { connectedDb } = useContext(ConnectionContext);
  const [fields, setFields] = useState<Field[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  // Debounce the search box so every keystroke doesn't trigger a full
  // schema re-sample + document query round trip.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const loadData = async () => {
    if (!collection) return;
    setLoading(true);
    try {
      const [schemaRes, docsRes] = await Promise.all([
        collectionService.getSchema(collection),
        documentService.list(collection, 1, 25, search),
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
    fields.forEach((f) => {
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

  if (!collection) return <p>No collection selected</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold capitalize">{collection}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSchemaOpen(true)}>
            <Info className="size-4" />
            Schema Info
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Add Document
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search documents..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-72"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {fields.filter((f) => f.name !== '_id').map((f) => (
                  <TableHead key={f.name}>{f.name}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  {fields.filter((f) => f.name !== '_id').map((f) => (
                    <TableCell key={f.name}>{renderCellValue(doc[f.name])}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={fields.length + 1} className="text-center text-muted-foreground">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        fields={fields}
        initialData={editingDoc}
        title={editingDoc ? 'Edit Document' : 'Create Document'}
      />

      <AnimatePresence>
        {schemaOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSchemaOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 z-50 h-full w-80 border-l bg-background p-6 shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Collection Schema</h2>
                <Button variant="ghost" size="icon" onClick={() => setSchemaOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Dynamically inferred from the latest documents in the collection.
              </p>
              <div className="border-t pt-4">
                <ul className="flex flex-col gap-4">
                  {fields.map((f) => (
                    <li key={f.name}>
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-sm font-semibold">{f.name}</span>
                        <FieldTypeBadge type={f.type} />
                      </div>
                      <p className="text-xs text-muted-foreground">Detected as {f.type}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionPage;
