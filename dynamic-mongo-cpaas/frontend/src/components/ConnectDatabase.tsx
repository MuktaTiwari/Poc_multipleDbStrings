import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
      toast.success('Database connected', { description: database });
      onConnected();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect MongoDB</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mongo-uri">MongoDB URI</Label>
            <Input
              id="mongo-uri"
              placeholder="mongodb+srv://..."
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mongo-alias">Connection Alias (e.g., Prod DB)</Label>
            <Input id="mongo-alias" value={alias} onChange={(e) => setAlias(e.target.value)} disabled={loading} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mongo-database">Database Name</Label>
            <Input
              id="mongo-database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="flex flex-col gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" /> {success}
              </span>
              <span className="text-muted-foreground">Database: {database}</span>
              <span className="text-muted-foreground">Collections found: {collectionsFound}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleTest} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Test Connection
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectDatabase;
