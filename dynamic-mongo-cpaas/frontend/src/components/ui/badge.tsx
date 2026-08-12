import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap gap-1',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-white',
        outline: 'text-foreground',
        blue: 'border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400',
        purple: 'border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400',
        green: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
        amber: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        slate: 'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-400',
        cyan: 'border-transparent bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
        rose: 'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
