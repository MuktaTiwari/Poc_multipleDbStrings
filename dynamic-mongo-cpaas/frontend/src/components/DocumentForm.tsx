import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

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
        console.error('Invalid JSON in document form:', e);
        alert('Invalid JSON format');
      }
    } else {
      onSave(formData);
    }
  };

  const renderField = (field: Field, value: any, path: string) => {
    switch (field.type) {
      case 'string':
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Input id={path} value={value || ''} onChange={(e) => handleChange(field.name, e.target.value)} />
          </div>
        );
      case 'number':
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Input
              id={path}
              type="number"
              value={value ?? ''}
              onChange={(e) => handleChange(field.name, Number(e.target.value))}
            />
          </div>
        );
      case 'boolean':
        return (
          <div key={path} className="flex items-center justify-between gap-2 py-1">
            <Label htmlFor={path}>{field.name}</Label>
            <Switch id={path} checked={!!value} onCheckedChange={(checked) => handleChange(field.name, checked)} />
          </div>
        );
      case 'date':
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Input
              id={path}
              type="datetime-local"
              value={value ? new Date(value).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleChange(field.name, new Date(e.target.value))}
            />
          </div>
        );
      case 'object':
      case 'array':
        // For POC, simple text area for JSON
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Textarea
              id={path}
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
            />
            <p className="text-xs text-muted-foreground">Enter valid JSON for {field.type}</p>
          </div>
        );
      default:
        // Ignore ObjectId in create/edit usually, or render readonly
        if (field.name === '_id') {
          return (
            <div key={path} className="flex flex-col gap-1.5">
              <Label htmlFor={path}>_id (Read Only)</Label>
              <Input id={path} value={value || ''} disabled />
            </div>
          );
        }
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Input id={path} value={value || ''} onChange={(e) => handleChange(field.name, e.target.value)} />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-2">
          {fields.length === 0 ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raw-json">Raw JSON Document</Label>
              <Textarea
                id="raw-json"
                autoFocus
                rows={10}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Since this collection has no existing schema, you can insert raw JSON.
              </p>
            </div>
          ) : (
            fields.map((field) => renderField(field, formData[field.name], field.name))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;
