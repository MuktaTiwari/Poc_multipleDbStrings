import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Power, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui/tooltip';
import { connectionService } from '../services/api';
import { ConnectionContext } from '../App';
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
    toast.success('Copied to clipboard');
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
      return <p className="text-sm text-muted-foreground">Loading...</p>;
    }

    if (connections.length === 0) {
      return (
        <div className="mt-2 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            No connections saved yet. Click "New Connection" to save a database URL.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-6 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Database Name</TableHead>
              <TableHead>MongoDB URI</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell>{conn.alias || '-'}</TableCell>
                <TableCell>{conn.database}</TableCell>
                <TableCell>
                  <span className="inline-block rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                    {conn.uri}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(conn.uri)}>
                            <Copy className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy URI</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {connectedDb?.id === conn.id ? (
                            <Button variant="ghost" size="icon" disabled className="text-green-500">
                              <CheckCircle2 className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleConnect(conn.id)}
                              disabled={connectingId === conn.id}
                            >
                              {connectingId === conn.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Power className="size-4" />
                              )}
                            </Button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {connectedDb?.id === conn.id ? 'Currently connected' : 'Connect to database'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Database Connections</h1>
        <Button onClick={() => setConnectOpen(true)}>
          <Plus className="size-4" />
          New Connection
        </Button>
      </div>

      {renderContent()}

      <ConnectDatabase open={connectOpen} onClose={() => setConnectOpen(false)} onConnected={fetchConnections} />
    </div>
  );
};

export default ConnectionsPage;
