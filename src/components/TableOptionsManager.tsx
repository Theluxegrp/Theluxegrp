import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, FolderOpen, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TableOption {
  id?: string;
  event_id: string;
  name: string;
  description: string;
  display_order: number;
  is_available: boolean;
}

interface Template {
  id: string;
  name: string;
  options: Array<{ name: string; description: string }>;
}

interface TableOptionsManagerProps {
  eventId: string;
  onClose: () => void;
}

export default function TableOptionsManager({ eventId, onClose }: TableOptionsManagerProps) {
  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadTableOptions();
    loadTemplates();
  }, [eventId]);

  const loadTableOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('table_options')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTableOptions(data || []);
    } catch (error) {
      console.error('Error loading table options:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('table_options_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const addTableOption = () => {
    const newOption: TableOption = {
      event_id: eventId,
      name: '',
      description: '',
      display_order: tableOptions.length,
      is_available: true,
    };
    setTableOptions([...tableOptions, newOption]);
  };

  const updateTableOption = (index: number, field: keyof TableOption, value: any) => {
    const updated = [...tableOptions];
    updated[index] = { ...updated[index], [field]: value };
    setTableOptions(updated);
  };

  const removeTableOption = (index: number) => {
    const updated = tableOptions.filter((_, i) => i !== index);
    setTableOptions(updated);
  };

  const saveTableOptions = async () => {
    setSaving(true);
    try {
      const existingIds = tableOptions.filter(opt => opt.id).map(opt => opt.id);

      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('table_options')
          .delete()
          .eq('event_id', eventId)
          .not('id', 'in', `(${existingIds.join(',')})`);

        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('table_options')
          .delete()
          .eq('event_id', eventId);

        if (deleteError) throw deleteError;
      }

      const optionsToSave = tableOptions.map((opt, idx) => ({
        ...opt,
        display_order: idx,
      }));

      for (const option of optionsToSave) {
        if (option.id) {
          const { error } = await supabase
            .from('table_options')
            .update(option)
            .eq('id', option.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('table_options')
            .insert(option);
          if (error) throw error;
        }
      }

      await loadTableOptions();
      alert('Table options saved successfully!');
    } catch (error) {
      console.error('Error saving table options:', error);
      alert('Failed to save table options');
    } finally {
      setSaving(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const templateOptions = tableOptions.map(opt => ({
        name: opt.name,
        description: opt.description,
      }));

      const { error } = await supabase
        .from('table_options_templates')
        .insert({
          name: templateName,
          options: templateOptions,
        });

      if (error) throw error;

      setTemplateName('');
      setShowSaveTemplate(false);
      await loadTemplates();
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const loadTemplate = (template: Template) => {
    const newOptions: TableOption[] = template.options.map((opt, idx) => ({
      event_id: eventId,
      name: opt.name,
      description: opt.description,
      display_order: idx,
      is_available: true,
    }));
    setTableOptions(newOptions);
    setShowTemplates(false);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('table_options_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...tableOptions];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setTableOptions(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">VIP Table Options</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Templates
          </button>
          {tableOptions.length > 0 && (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save as Template
            </button>
          )}
        </div>
      </div>

      {showTemplates && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Load from Template</h4>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-600">No templates saved yet</p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{template.name}</div>
                    <div className="text-xs text-slate-600">
                      {template.options.length} table options
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadTemplate(template)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSaveTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Save Current Options as Template</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveAsTemplate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveTemplate(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tableOptions.map((option, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className="bg-white border border-slate-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="cursor-move mt-2">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => updateTableOption(index, 'name', e.target.value)}
                    placeholder="e.g., Premium Booth, VIP Section"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={option.description}
                    onChange={(e) => updateTableOption(index, 'description', e.target.value)}
                    placeholder="Describe this table option..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={option.is_available}
                    onChange={(e) => updateTableOption(index, 'is_available', e.target.checked)}
                    className="w-4 h-4 text-blue-500 border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">Available for booking</span>
                </label>
              </div>
              <button
                onClick={() => removeTableOption(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addTableOption}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Table Option
      </button>

      <div className="flex gap-3 pt-4">
        <button
          onClick={saveTableOptions}
          disabled={saving || tableOptions.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Table Options'}
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
