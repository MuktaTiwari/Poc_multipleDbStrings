import React from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const blobTransition = (duration: number) => ({
  duration,
  repeat: Infinity,
  repeatType: 'mirror' as const,
  ease: 'easeInOut' as const,
});

const AuthShell: React.FC<AuthShellProps> = ({ title, description, children, footer }) => {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/30 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={blobTransition(11)}
        />
        <motion.div
          className="absolute top-1/3 -right-24 size-80 rounded-full bg-blue-500/20 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
          transition={blobTransition(13)}
        />
        <motion.div
          className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-purple-500/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={blobTransition(15)}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="items-center text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <Database className="size-6" />
            </motion.div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthShell;
