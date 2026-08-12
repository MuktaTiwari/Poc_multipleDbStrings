import React from 'react';
import { motion } from 'framer-motion';
import { Boxes, Database, Network, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SchemaDiscoveryShowcase from './SchemaDiscoveryShowcase';

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Rotating refresh tokens' },
  { icon: Sparkles, label: 'Zero hardcoded schemas' },
  { icon: Zap, label: 'Instant CRUD UI' },
];

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const floatTransition = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: 'mirror' as const,
  ease: 'easeInOut' as const,
});

const AuthShell: React.FC<AuthShellProps> = ({ title, description, children, footer }) => {
  return (
    <div className="grid min-h-svh w-full lg:grid-cols-2">
      {/* Brand / product-story panel - intentionally always dark, it's a fixed backdrop, not a themeable surface */}
      <div className="relative hidden overflow-hidden bg-[#0d0b17] lg:flex lg:flex-col lg:justify-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <motion.div
          className="absolute top-[-10%] left-[-10%] size-96 rounded-full bg-primary/25 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={floatTransition(14)}
        />
        <motion.div
          className="absolute right-[-10%] bottom-[-15%] size-96 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={floatTransition(17)}
        />

        <motion.div
          className="absolute top-16 right-16 text-white/50"
          animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
          transition={floatTransition(9)}
        >
          <Database className="size-10" />
        </motion.div>
        <motion.div
          className="absolute bottom-24 left-12 text-white/50"
          animate={{ y: [0, 14, 0], rotate: [0, -8, 0] }}
          transition={floatTransition(11, 1)}
        >
          <Boxes className="size-8" />
        </motion.div>
        <motion.div
          className="absolute top-1/3 left-16 text-white/50"
          animate={{ y: [0, 10, 0] }}
          transition={floatTransition(8, 0.5)}
        >
          
          <Network className="size-7" />
        </motion.div>

        <SchemaDiscoveryShowcase />

        <p className="relative z-10 mx-auto mt-10 max-w-sm px-8 text-sm text-white/40">
          Connect any MongoDB database and the schema, tables, and forms appear automatically — no code changes.
        </p>
      </div>

      {/* Form panel - this side follows the site's light/dark theme */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 lg:border-l">
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent)',
          }}
        />
        <div className="absolute top-1/3 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute top-6 left-6 z-10 hidden items-center gap-2 sm:flex">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground">
            <Database className="size-4" />
          </span>
          <span className="text-sm font-semibold">Dynamic CPaaS</span>
        </div>

        <ThemeToggle className="absolute top-4 right-4 z-10" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <motion.div
                className="absolute inset-0 -m-1.5 rounded-2xl border-2 border-primary/40"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className="relative flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/30"
              >
                <Database className="size-6" />
              </motion.div>
            </div>
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-xl font-semibold text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}

          <div className="mt-8 flex items-center justify-center gap-4 border-t pt-5">
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className="size-3.5 text-primary" />
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthShell;
