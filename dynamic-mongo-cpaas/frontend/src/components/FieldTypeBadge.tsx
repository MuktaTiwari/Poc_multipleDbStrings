import React from 'react';
import { Badge, type BadgeProps } from './ui/badge';

interface FieldTypeBadgeProps {
  type: string;
}

const VARIANT_BY_TYPE: Record<string, NonNullable<BadgeProps['variant']>> = {
  string: 'blue',
  number: 'purple',
  boolean: 'green',
  date: 'amber',
  object: 'slate',
  array: 'outline',
};

const FieldTypeBadge: React.FC<FieldTypeBadgeProps> = ({ type }) => (
  <Badge variant={VARIANT_BY_TYPE[type] ?? 'outline'}>{type}</Badge>
);

export default FieldTypeBadge;
