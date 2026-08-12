import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Database, Plus } from 'lucide-react';
import { ConnectionContext } from '../App';
import { collectionService } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const CARD_GRADIENTS = [
  'from-primary to-fuchsia-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

const DashboardPage: React.FC = () => {
  const { connectedDb } = useContext(ConnectionContext);
  const navigate = useNavigate();
  const [collections, setCollections] = useState<{ name: string }[]>([]);
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
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <Database className="mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-1 text-xl font-medium text-muted-foreground">No Active Database Connection</h2>
        <p className="mb-6 text-muted-foreground">Please connect to a database to view and manage collections.</p>
        <Button size="lg" onClick={() => navigate('/connections')}>
          Go to Connections
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold">
            <Database className="size-6 text-primary" />
            Database: {connectedDb.database}
          </h1>
          <p className="text-muted-foreground">Manage your collections and schemas dynamically.</p>
        </div>
        <Button onClick={() => setCreateColOpen(true)}>
          <Plus className="size-4" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center">
          <h3 className="mb-1 font-medium text-muted-foreground">This database is empty.</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first collection to start storing data.</p>
          <Button variant="outline" onClick={() => setCreateColOpen(true)}>
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {collections.map((col, index) => (
            <motion.div
              key={col.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card
                className="group cursor-pointer border-border/60 transition-transform hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate(`/collections/${col.name}`)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} text-white shadow-sm`}
                    >
                      <Database className="size-5" />
                    </div>
                    <span className="font-medium">{col.name}</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={createColOpen} onOpenChange={setCreateColOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-collection-name">Collection Name</Label>
            <Input
              id="new-collection-name"
              autoFocus
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateColOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
