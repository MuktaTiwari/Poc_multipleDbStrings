import React from 'react';
import { Chip } from '@mui/material';

interface FieldTypeBadgeProps {
  type: string;
}

const FieldTypeBadge: React.FC<FieldTypeBadgeProps> = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case 'string': return 'primary';
      case 'number': return 'secondary';
      case 'boolean': return 'success';
      case 'date': return 'warning';
      case 'object': return 'info';
      case 'array': return 'default';
      default: return 'default';
    }
  };

  return <Chip label={type} size="small" color={getColor() as any} variant="outlined" />;
};

export default FieldTypeBadge;
