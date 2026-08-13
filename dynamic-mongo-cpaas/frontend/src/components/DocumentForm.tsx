import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Code, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
  
  // Custom fields logic
  const [customFields, setCustomFields] = useState<Field[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');

  const [viewMode, setViewMode] = useState<'gui' | 'json'>('gui');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setRawJson(JSON.stringify(initialData, null, 2));
      
      // Auto-detect extra fields from initialData that aren't in the schema
      const schemaFieldNames = new Set(fields.map(f => f.name));
      const extraFields: Field[] = [];
      Object.keys(initialData).forEach(key => {
        if (!schemaFieldNames.has(key) && key !== '_id') {
          const type = typeof initialData[key];
          extraFields.push({
            name: key,
            type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : type === 'object' ? 'object' : 'string'
          });
        }
      });
      setCustomFields(extraFields);
    } else {
      setFormData({});
      setRawJson('{\n  \n}');
      setCustomFields([]);
    }
    
    setIsAddingField(false);
    setNewFieldName('');
    
    // Default to JSON mode if there's no schema at all (and no custom fields detected)
    if (fields.length === 0 && !initialData) {
      setViewMode('json');
    } else {
      setViewMode('gui');
    }
  }, [initialData, open, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const allFields = [...fields, ...customFields];
    
    if (allFields.some(f => f.name === newFieldName.trim())) {
      alert("A field with this name already exists.");
      return;
    }
    
    setCustomFields(prev => [...prev, { name: newFieldName.trim(), type: newFieldType }]);
    setIsAddingField(false);
    setNewFieldName('');
    setNewFieldType('string');
  };

  const toggleViewMode = () => {
    if (viewMode === 'gui') {
      setRawJson(JSON.stringify(formData, null, 2));
      setViewMode('json');
    } else {
      try {
        const parsed = JSON.parse(rawJson);
        setFormData(parsed);
        
        // Auto-detect any new fields added via JSON and update customFields
        const allFieldNames = new Set([...fields.map(f => f.name), ...customFields.map(f => f.name)]);
        const newExtraFields: Field[] = [];
        Object.keys(parsed).forEach(key => {
          if (!allFieldNames.has(key) && key !== '_id') {
            const type = typeof parsed[key];
            newExtraFields.push({
              name: key,
              type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : type === 'object' ? 'object' : 'string'
            });
          }
        });
        if (newExtraFields.length > 0) {
          setCustomFields(prev => [...prev, ...newExtraFields]);
        }
        
        setViewMode('gui');
      } catch (e) {
        alert("Invalid JSON format. Please fix errors before switching to Form Mode.");
      }
    }
  };

  const handleSave = () => {
    if (viewMode === 'json' || fields.length === 0) {
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
        return (
          <div key={path} className="flex flex-col gap-1.5">
            <Label htmlFor={path}>{field.name}</Label>
            <Textarea
              id={path}
              rows={4}
              value={value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Enter valid JSON for {field.type}</p>
          </div>
        );
      default:
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

  const allFields = [...fields, ...customFields];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle>{title}</DialogTitle>
            {allFields.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleViewMode} className="h-8 px-2 text-xs">
                {viewMode === 'gui' ? (
                  <><Code className="mr-1.5 size-3.5" /> JSON Mode</>
                ) : (
                  <><FileText className="mr-1.5 size-3.5" /> Form Mode</>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-2 pr-2">
          {viewMode === 'json' || allFields.length === 0 ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raw-json">Raw JSON Document</Label>
              <Textarea
                id="raw-json"
                autoFocus
                rows={12}
                className="font-mono text-xs"
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Edit the raw JSON to quickly add or modify multiple fields at once.
              </p>
            </div>
          ) : (
            <>
              {allFields.map((field) => renderField(field, formData[field.name], field.name))}
              
              {/* Add Field UI */}
              {isAddingField ? (
                <div className="mt-2 flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 flex-col flex gap-1.5">
                      <Label>Field Name</Label>
                      <Input 
                        placeholder="e.g. status" 
                        autoFocus
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                      />
                    </div>
                    <div className="flex-1 flex-col flex gap-1.5">
                      <Label>Type</Label>
                      <Select value={newFieldType} onValueChange={setNewFieldType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="object">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingField(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddField}>
                      <Check className="mr-1.5 size-4" /> Add
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-2 w-full border-dashed" 
                  onClick={() => setIsAddingField(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Add New Field
                </Button>
              )}
            </>
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
