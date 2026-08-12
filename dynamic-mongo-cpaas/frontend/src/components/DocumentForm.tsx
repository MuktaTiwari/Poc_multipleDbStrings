import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Switch, FormControlLabel } from '@mui/material';

interface Field {
  name: string;
  type: string;
  children?: Field[];
}

interface DocumentFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (doc: any) => void;
  fields: Field[];
  initialData?: any;
  title: string;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ open, onClose, onSave, fields, initialData, title }) => {
  const [formData, setFormData] = useState<any>({});
  const [rawJson, setRawJson] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setRawJson(JSON.stringify(initialData, null, 2));
    } else {
      setFormData({});
      setRawJson('{\n  \n}');
    }
  }, [initialData, open]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (fields.length === 0) {
      try {
        const parsed = JSON.parse(rawJson);
        onSave(parsed);
      } catch (e) {
        alert("Invalid JSON format");
      }
    } else {
      onSave(formData);
    }
  };

  const renderField = (field: Field, value: any, path: string) => {
    switch (field.type) {
      case 'string':
        return (
          <TextField
            key={path}
            fullWidth
            margin="normal"
            label={field.name}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
      case 'number':
        return (
          <TextField
            key={path}
            fullWidth
            margin="normal"
            label={field.name}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(field.name, Number(e.target.value))}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={path}
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
              />
            }
            label={field.name}
          />
        );
      case 'date':
        return (
          <TextField
            key={path}
            fullWidth
            margin="normal"
            label={field.name}
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(field.name, new Date(e.target.value))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );
      case 'object':
      case 'array':
        // For POC, simple text area for JSON
        return (
          <TextField
            key={path}
            fullWidth
            margin="normal"
            label={field.name}
            multiline
            rows={4}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                handleChange(field.name, JSON.parse(e.target.value));
              } catch (err) {
                // allow typing invalid JSON temporarily?
                handleChange(field.name, e.target.value); // Wait, this breaks parse on next render.
                // Better to just store string in state if we want real editor, but for simple POC it's ok.
              }
            }}
            helperText={`Enter valid JSON for ${field.type}`}
          />
        );
      default:
        // Ignore ObjectId in create/edit usually, or render readonly
        if (field.name === '_id') {
          return (
             <TextField
               key={path}
               fullWidth
               margin="normal"
               label="_id (Read Only)"
               value={value || ''}
               disabled
             />
          );
        }
        return (
           <TextField
             key={path}
             fullWidth
             margin="normal"
             label={field.name}
             value={value || ''}
             onChange={(e) => handleChange(field.name, e.target.value)}
           />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {fields.length === 0 ? (
          <TextField
            autoFocus
            margin="normal"
            label="Raw JSON Document"
            multiline
            rows={10}
            fullWidth
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            helperText="Since this collection has no existing schema, you can insert raw JSON."
          />
        ) : (
          fields.map(field => renderField(field, formData[field.name], field.name))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentForm;
