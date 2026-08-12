import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Copy, Power, CheckCircle2, Plus, Loader2, Link2, Database } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
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

const CARD_GRADIENTS = [
  'from-primary to-fuchsia-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

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
      toast.success('Switched connection');
      navigate('/');
    } catch (err) {
      console.error('Failed to connect:', err);
      toast.error('Failed to connect');
    } finally {
      setConnectingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      );
    }

    if (connections.length === 0) {
      return (
        <div className="mt-6 flex flex-col items-center rounded-2xl border p-12 text-center">
          <Link2 className="mb-4 size-14 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-muted-foreground">No connections saved yet.</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Click "New Connection" to save a MongoDB URL you can switch back to any time.
          </p>
          <Button onClick={() => setConnectOpen(true)}>
            <Plus className="size-4" />
            New Connection
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {connections.map((conn, index) => {
          const isConnected = connectedDb?.id === conn.id;
          const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

          return (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={
                  isConnected
                    ? 'border-emerald-500/40 shadow-emerald-500/10 shadow-md'
                    : 'border-border/60 transition-shadow hover:shadow-md'
                }
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                      <Database className="size-5" />
                    </div>
                    {isConnected && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Connected
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold">{conn.alias || conn.database}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{conn.database}</p>

                  <div className="mb-4 flex items-center gap-1.5 rounded-md bg-muted px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                      {conn.uri}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0"
                            onClick={() => handleCopy(conn.uri)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy URI</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Button
                    variant={isConnected ? 'secondary' : 'outline'}
                    className="w-full"
                    disabled={isConnected || connectingId === conn.id}
                    onClick={() => handleConnect(conn.id)}
                  >
                    {connectingId === conn.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Power className="size-4" />
                    )}
                    {isConnected ? 'Currently connected' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saved Database Connections</h1>
          <p className="text-muted-foreground">Switch between MongoDB databases you've connected before.</p>
        </div>
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
