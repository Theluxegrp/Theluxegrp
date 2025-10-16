import { useEffect, useState } from 'react';
import { Plus, Save, X, Copy, Trash2 } from 'lucide-react';
import { supabase, type EventTemplate, type Venue } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';

type AdminTemplatesProps = {
  onCreateEventFromTemplate?: (template: EventTemplate) => void;
};

export default function AdminTemplates({ onCreateEventFromTemplate }: AdminTemplatesProps) {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_name: '',
    template_description: '',
    dress_code: 'Smart Casual',
    music_genre: 'Mixed',
    min_age: 21,
    guest_list_available: true,
    sections_available: true,
    special_events_available: true,
    image_url: '',
    sections: [] as Array<{ name: string; capacity: number; minimum_spend: number; description: string }>,
    bottle_packages: [] as Array<{ name: string; description: string; price: number; bottles_included: string[]; serves: number }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesRes, venuesRes] = await Promise.all([
        supabase.from('event_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('venues').select('*').order('name'),
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (venuesRes.data) setVenues(venuesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        alert('You must be logged in to save templates');
        return;
      }

      const templateData = {
        name: formData.template_name,
        description: formData.template_description,
        dress_code: formData.dress_code,
        music_genre: formData.music_genre,
        min_age: formData.min_age,
        guest_list_available: formData.guest_list_available,
        sections_available: formData.sections_available,
        special_events_available: formData.special_events_available,
        image_url: formData.image_url,
        sections: formData.sections,
        bottle_packages: formData.bottle_packages,
      };

      const { error } = await supabase.from('event_templates').insert({
        name: formData.name,
        description: formData.description,
        template_data: templateData,
        created_by: user.id,
      });

      if (error) throw error;

      await loadData();
      resetForm();
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase.from('event_templates').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleCreateFromTemplate = async (template: EventTemplate) => {
    if (!confirm('Create a new event from this template?')) return;

    const venueId = venues.length > 0 ? venues[0].id : '';
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          name: template.template_data.name,
          description: template.template_data.description,
          venue_id: venueId,
          event_date: eventDate.toISOString(),
          image_url: template.template_data.image_url || null,
          dress_code: template.template_data.dress_code,
          music_genre: template.template_data.music_genre,
          min_age: template.template_data.min_age,
          guest_list_available: template.template_data.guest_list_available,
          sections_available: template.template_data.sections_available,
          special_events_available: template.template_data.special_events_available,
          display_order: 0,
          is_published: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      if (template.template_data.sections && eventData) {
        for (const section of template.template_data.sections) {
          await supabase.from('sections').insert({
            event_id: eventData.id,
            ...section,
            is_available: true,
          });
        }
      }

      if (template.template_data.bottle_packages && eventData) {
        for (const pkg of template.template_data.bottle_packages) {
          await supabase.from('bottle_packages').insert({
            event_id: eventData.id,
            ...pkg,
            is_available: true,
          });
        }
      }

      alert('Event created from template! Check the Events page to edit and publish.');
    } catch (error) {
      console.error('Error creating event from template:', error);
      alert('Failed to create event from template');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      name: '',
      description: '',
      template_name: '',
      template_description: '',
      dress_code: 'Smart Casual',
      music_genre: 'Mixed',
      min_age: 21,
      guest_list_available: true,
      sections_available: true,
      special_events_available: true,
      image_url: '',
      sections: [],
      bottle_packages: [],
    });
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Event Templates</h2>
            <p className="text-sm text-slate-600 mt-1">
              Save event configurations to reuse for future events
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{showForm ? 'Cancel' : 'New Template'}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Saturday Night Package"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Name (in template)
                </label>
                <input
                  type="text"
                  required
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Saturday Night Event"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Template Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                placeholder="When to use this template..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Event Description (in template)
              </label>
              <textarea
                required
                value={formData.template_description}
                onChange={(e) =>
                  setFormData({ ...formData, template_description: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dress Code</label>
                <input
                  type="text"
                  required
                  value={formData.dress_code}
                  onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Music Genre</label>
                <input
                  type="text"
                  required
                  value={formData.music_genre}
                  onChange={(e) => setFormData({ ...formData, music_genre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min Age</label>
                <input
                  type="number"
                  required
                  min="18"
                  value={formData.min_age}
                  onChange={(e) => setFormData({ ...formData, min_age: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.guest_list_available}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_list_available: e.target.checked })
                  }
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Guest List Available</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sections_available}
                  onChange={(e) =>
                    setFormData({ ...formData, sections_available: e.target.checked })
                  }
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Sections Available</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.special_events_available}
                  onChange={(e) =>
                    setFormData({ ...formData, special_events_available: e.target.checked })
                  }
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Special Events Available</span>
              </label>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>Save Template</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-slate-600">{template.description}</p>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Event Name:</span>
                <span className="font-medium text-slate-900">{template.template_data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Music:</span>
                <span className="font-medium text-slate-900">{template.template_data.music_genre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dress Code:</span>
                <span className="font-medium text-slate-900">{template.template_data.dress_code}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleCreateFromTemplate(template)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Use Template</span>
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl shadow-md">
          <p className="text-slate-500 text-lg">No templates yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
