import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
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

  const [isConfirmingNewDb, setIsConfirmingNewDb] = useState(false);

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

  const proceedWithConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      await connectionService.connect(mongoUri, database, alias);
      toast.success('Database connected', { description: database });
      onConnected();
      onClose();
      // Reset state for next time
      setIsConfirmingNewDb(false);
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
      // Test the connection first to check if the database exists / has collections
      const testRes = await connectionService.testConnection(mongoUri, database);
      
      if (testRes.data.collections.length === 0) {
        setIsConfirmingNewDb(true);
        setLoading(false);
        return;
      }

      await proceedWithConnection();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        onClose();
        setIsConfirmingNewDb(false);
      }
    }}>
      <DialogContent>
        {isConfirmingNewDb ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="size-5" />
                New Database Creation
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="mb-4 text-muted-foreground">
                The database <strong className="font-semibold text-foreground">{database}</strong> is not available or is currently empty.
              </p>
              <p className="text-sm text-muted-foreground">
                Connecting will create a new empty database where you can add your collections. Do you want to proceed?
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmingNewDb(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={proceedWithConnection} disabled={loading} className="bg-amber-500 text-white hover:bg-amber-600">
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create & Connect
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectDatabase;
