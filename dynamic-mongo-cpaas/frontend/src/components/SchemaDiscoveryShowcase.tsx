import React, { useEffect, useState, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FieldTypeBadge from './FieldTypeBadge';

interface Sample {
  collection: string;
  dot: string;
  doc: Record<string, any>;
}

const SAMPLES: Sample[] = [
  {
    collection: 'customers',
    dot: 'bg-blue-400',
    doc: { name: 'Ava Thompson', email: 'ava@acme.io', age: 29, active: true },
  },
  {
    collection: 'orders',
    dot: 'bg-amber-400',
    doc: { orderId: 'ORD-1042', total: 249.99, placedAt: '2026-08-01', items: ['SKU-88', 'SKU-12'] },
  },
  {
    collection: 'products',
    dot: 'bg-emerald-400',
    doc: { sku: 'SKU-88', price: 39.5, inStock: true, tags: ['audio', 'wireless'] },
  },
];

const inferType = (value: any): string => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
  return typeof value;
};

const renderValue = (value: any): React.ReactNode => {
  if (Array.isArray(value)) {
    return (
      <>
        [
        {value.map((v, i) => (
          <Fragment key={i}>
            <span className="text-emerald-300">&quot;{v}&quot;</span>
            {i < value.length - 1 && ', '}
          </Fragment>
        ))}
        ]
      </>
    );
  }
  if (typeof value === 'string') return <span className="text-emerald-300">&quot;{value}&quot;</span>;
  if (typeof value === 'number') return <span className="text-amber-300">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-fuchsia-300">{String(value)}</span>;
  return String(value);
};

const CYCLE_MS = 4200;

const SchemaDiscoveryShowcase: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % SAMPLES.length), CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const sample = SAMPLES[index];
  const entries = Object.entries(sample.doc);

  return (
    <div className="relative z-10 mx-auto w-full max-w-sm px-8">
      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-white/60">
        <motion.span
          className="flex size-2 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        Watching for new documents...
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sample.collection}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className={`size-2 rounded-full ${sample.dot}`} />
            <span className="font-mono text-sm text-white/70">db.{sample.collection}.insertOne(...)</span>
          </div>

          <div className="mb-5 rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[13px] leading-relaxed text-white/90 backdrop-blur-sm">
            {'{'}
            <div className="pl-4">
              {entries.map(([key, value], i) => (
                <div key={key}>
                  <span className="text-sky-300">&quot;{key}&quot;</span>: {renderValue(value)}
                  {i < entries.length - 1 && ','}
                </div>
              ))}
            </div>
            {'}'}
          </div>

          <p className="mb-2 text-[11px] font-medium tracking-wider text-white/40 uppercase">
            Fields discovered automatically
          </p>
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
          >
            {entries.map(([key, value]) => (
              <motion.div
                key={key}
                variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1"
              >
                <span className="text-xs text-white/70">{key}</span>
                <FieldTypeBadge type={inferType(value)} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SchemaDiscoveryShowcase;
