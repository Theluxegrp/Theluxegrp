import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff, FileText } from 'lucide-react';
import { supabase, type Event } from '../lib/supabase';
import ImageCropModal from '../components/ImageCropModal';

type AdminEventsProps = {
  onCreateFromTemplate?: () => void;
};

export default function AdminEvents({ onCreateFromTemplate }: AdminEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    event_date: '',
    event_time: '21:00',
    day_of_week: '5',
    image_url: '',
    dress_code: 'Smart Casual',
    music_genre: 'Mixed',
    min_age: 21,
    is_published: true,
    is_recurring: false,
    booking_url_enabled: false,
    booking_url: '',
    guest_list_enabled: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, templatesRes] = await Promise.all([
        supabase.from('events').select('*').order('display_order', { ascending: true }),
        supabase.from('event_templates').select('*').order('created_at', { ascending: false })
      ]);

      if (eventsRes.error) {
        console.error('Error loading events:', eventsRes.error);
      }
      if (templatesRes.error) {
        console.error('Error loading templates:', templatesRes.error);
      }

      console.log('Events loaded:', eventsRes.data?.length || 0);
      console.log('Templates loaded:', templatesRes.data?.length || 0);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob: Blob) => {
    console.log('Crop completed, blob size:', blob.size);
    setCroppedBlob(blob);
    const url = URL.createObjectURL(blob);
    setImagePreview(url);
    setShowCropModal(false);

    const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
    setSelectedFile(file);
    console.log('Selected file set:', file.name, file.size);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) {
      console.log('No selected file, returning existing URL:', formData.image_url);
      return formData.image_url || null;
    }

    console.log('Uploading image, file:', selectedFile.name, selectedFile.size);
    setUploading(true);
    try {
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      console.log('Uploading to path:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      console.log('Upload successful, public URL:', publicUrl);

      if (editingEvent && editingEvent.image_url) {
        try {
          const oldImagePath = editingEvent.image_url.split('/').pop()?.split('?')[0];
          if (oldImagePath && oldImagePath.includes('-')) {
            console.log('Deleting old image:', oldImagePath);
            await supabase.storage.from('event-images').remove([oldImagePath]);
          }
        } catch (deleteError) {
          console.warn('Could not delete old image:', deleteError);
        }
      }

      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      console.log('Final URL with cache bust:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;
      console.log('HandleSubmit - Initial imageUrl:', imageUrl);
      console.log('HandleSubmit - selectedFile:', selectedFile?.name);

      if (selectedFile) {
        console.log('HandleSubmit - Calling uploadImage');
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          console.log('HandleSubmit - Upload failed, aborting');
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
        console.log('HandleSubmit - New imageUrl from upload:', imageUrl);
      }

      let eventDate: string;
      let recurrenceDay: number | null = null;

      if (formData.is_recurring) {
        const dayOfWeek = parseInt(formData.day_of_week);
        recurrenceDay = dayOfWeek;

        const now = new Date();
        const currentDay = now.getDay();
        let daysUntilNext = dayOfWeek - currentDay;
        if (daysUntilNext <= 0) daysUntilNext += 7;

        const nextOccurrence = new Date(now);
        nextOccurrence.setDate(now.getDate() + daysUntilNext);

        const [hours, minutes] = formData.event_time.split(':');
        nextOccurrence.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        eventDate = nextOccurrence.toISOString();
      } else {
        const [hours, minutes] = formData.event_time.split(':');
        const dateTime = new Date(formData.event_date);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        eventDate = dateTime.toISOString();
        recurrenceDay = null;
      }

      const dataToSave = {
        venue_id: null,
        name: formData.name,
        description: formData.description,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        venue_city: formData.venue_city,
        event_date: eventDate,
        image_url: imageUrl,
        dress_code: formData.dress_code,
        music_genre: formData.music_genre,
        min_age: formData.min_age,
        is_published: formData.is_published,
        is_recurring: formData.is_recurring,
        recurrence_day: recurrenceDay,
        booking_url_enabled: formData.booking_url_enabled,
        booking_url: formData.booking_url_enabled ? formData.booking_url : null,
        guest_list_enabled: formData.guest_list_enabled,
      };

      console.log('HandleSubmit - Data to save:', dataToSave);

      if (editingEvent) {
        console.log('HandleSubmit - Updating event:', editingEvent.id);
        const { error } = await supabase
          .from('events')
          .update(dataToSave)
          .eq('id', editingEvent.id);
        if (error) {
          console.error('Database update error:', error);
          throw error;
        }
        console.log('HandleSubmit - Update successful');
      } else {
        const maxOrder = events.reduce((max, e) => Math.max(max, e.display_order), -1);
        const { error } = await supabase.from('events').insert({
          ...dataToSave,
          display_order: maxOrder + 1,
        });
        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Failed to save event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setImagePreview(event.image_url || '');

    const eventDate = new Date(event.event_date);
    const timeString = eventDate.toTimeString().slice(0, 5);

    setFormData({
      name: event.name,
      description: event.description,
      venue_name: (event as any).venue_name || '',
      venue_address: (event as any).venue_address || '',
      venue_city: (event as any).venue_city || '',
      event_date: event.event_date.slice(0, 10),
      event_time: timeString,
      day_of_week: event.recurrence_day?.toString() || '5',
      image_url: event.image_url || '',
      dress_code: event.dress_code,
      music_genre: event.music_genre,
      min_age: event.min_age,
      is_published: event.is_published,
      is_recurring: event.is_recurring || false,
      booking_url_enabled: (event as any).booking_url_enabled || false,
      booking_url: (event as any).booking_url || '',
      guest_list_enabled: (event as any).guest_list_enabled || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const togglePublished = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !event.is_published })
        .eq('id', event.id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error toggling published status:', error);
    }
  };

  const saveCurrentEventAsTemplate = async () => {
    const templateName = prompt('Enter a name for this template:', formData.name ? `${formData.name} Template` : 'New Template');

    if (!templateName) return;

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        venue_city: formData.venue_city,
        image_url: formData.image_url,
        dress_code: formData.dress_code,
        music_genre: formData.music_genre,
        min_age: formData.min_age,
        is_recurring: formData.is_recurring,
        event_time: formData.event_time,
        day_of_week: formData.day_of_week,
        booking_url_enabled: formData.booking_url_enabled,
        booking_url: formData.booking_url,
        guest_list_enabled: formData.guest_list_enabled,
      };

      console.log('Saving template with data:', { name: templateName, template_data: templateData });

      const { data, error } = await supabase.from('event_templates').insert({
        name: templateName,
        description: `Template: ${templateName}`,
        template_data: templateData,
      }).select();

      console.log('Insert result - data:', data, 'error:', error);

      if (error) {
        console.error('Template save error details:', error);
        throw error;
      }

      alert(`Template "${templateName}" created successfully!`);

      const { data: templates } = await supabase.from('event_templates').select('*');
      console.log('All templates after save:', templates);
      setTemplates(templates || []);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadFromTemplate = async (templateId: string) => {
    if (!templateId) return;

    try {
      const { data: template, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      const templateData = template.template_data;
      setFormData({
        name: templateData.name || '',
        description: templateData.description || '',
        venue_name: templateData.venue_name || '',
        venue_address: templateData.venue_address || '',
        venue_city: templateData.venue_city || '',
        event_date: '',
        event_time: templateData.event_time || '21:00',
        day_of_week: templateData.day_of_week || '5',
        image_url: templateData.image_url || '',
        dress_code: templateData.dress_code || 'Smart Casual',
        music_genre: templateData.music_genre || 'Mixed',
        min_age: templateData.min_age || 21,
        is_published: true,
        is_recurring: templateData.is_recurring || false,
        booking_url_enabled: templateData.booking_url_enabled || false,
        booking_url: templateData.booking_url || '',
        guest_list_enabled: templateData.guest_list_enabled || false,
      });

      if (templateData.image_url) {
        setImagePreview(templateData.image_url);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    }
  };

  const handleDragStart = (event: Event) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetEvent: Event) => {
    if (!draggedEvent || draggedEvent.id === targetEvent.id) return;

    const draggedIndex = events.findIndex((e) => e.id === draggedEvent.id);
    const targetIndex = events.findIndex((e) => e.id === targetEvent.id);

    const newEvents = [...events];
    newEvents.splice(draggedIndex, 1);
    newEvents.splice(targetIndex, 0, draggedEvent);

    const updates = newEvents.map((event, index) => ({
      id: event.id,
      display_order: index,
    }));

    setEvents(newEvents);

    try {
      for (const update of updates) {
        await supabase.from('events').update({ display_order: update.display_order }).eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering events:', error);
      await loadData();
    }

    setDraggedEvent(null);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setSelectedFile(null);
    setImagePreview('');
    setCroppedBlob(null);
    setTempImageUrl('');
    setShowCropModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormData({
      name: '',
      description: '',
      venue_name: '',
      venue_address: '',
      venue_city: '',
      event_date: '',
      image_url: '',
      dress_code: 'Smart Casual',
      music_genre: 'Mixed',
      min_age: 21,
      is_published: true,
      is_recurring: false,
      event_time: '21:00',
      day_of_week: '5',
      booking_url_enabled: false,
      booking_url: '',
      guest_list_enabled: false,
    });
  };

  if (loading && events.length === 0) {
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
          <h2 className="text-2xl font-bold text-slate-900">Events Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{showForm ? 'Cancel' : 'New Event'}</span>
          </button>
        </div>

        {showForm && (
          <div className="border-t pt-4">
            {!editingEvent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start from a template (optional)
                </label>
                {templates.length > 0 ? (
                  <>
                    <select
                      onChange={(e) => loadFromTemplate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                      defaultValue=""
                    >
                      <option value="">Select a template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-600 mt-2">
                      Loading a template will populate the form with saved data. You can then modify as needed.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    No templates available yet. Create your first event and save it as a template to use it for future events.
                  </p>
                )}
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Venue Name</label>
                <input
                  type="text"
                  required
                  value={formData.venue_name}
                  onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., The Luxe Club"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Venue Address</label>
                <input
                  type="text"
                  required
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., 123 Sunset Blvd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  required
                  value={formData.venue_city}
                  onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., Los Angeles"
                />
              </div>

              {!formData.is_recurring ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Date</label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Time</label>
                    <select
                      required
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    >
                      <option value="00:00">12:00 AM</option>
                      <option value="01:00">1:00 AM</option>
                      <option value="02:00">2:00 AM</option>
                      <option value="03:00">3:00 AM</option>
                      <option value="04:00">4:00 AM</option>
                      <option value="05:00">5:00 AM</option>
                      <option value="06:00">6:00 AM</option>
                      <option value="07:00">7:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="23:00">11:00 PM</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Day of Week</label>
                    <select
                      required
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Time</label>
                    <select
                      required
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    >
                      <option value="00:00">12:00 AM</option>
                      <option value="01:00">1:00 AM</option>
                      <option value="02:00">2:00 AM</option>
                      <option value="03:00">3:00 AM</option>
                      <option value="04:00">4:00 AM</option>
                      <option value="05:00">5:00 AM</option>
                      <option value="06:00">6:00 AM</option>
                      <option value="07:00">7:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="23:00">11:00 PM</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Image</label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                  />
                  {(imagePreview || formData.image_url) && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Accepted formats: JPEG, PNG, WebP. Max size: 5MB
                  </p>
                </div>
              </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Published</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Recurring Weekly Event</span>
              </label>
            </div>

            {formData.is_recurring && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <strong>Recurring Event:</strong> This event will repeat every week on{' '}
                  <strong>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(formData.day_of_week)]}</strong>{' '}
                  at <strong>{new Date(`2000-01-01T${formData.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong>.
                </p>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.booking_url_enabled}
                  onChange={(e) => setFormData({ ...formData, booking_url_enabled: e.target.checked })}
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable External Booking Link</span>
              </label>

              {formData.booking_url_enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Booking URL
                  </label>
                  <input
                    type="text"
                    value={formData.booking_url}
                    onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                    placeholder="example.com/book or https://example.com/book"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This will display a "Book Now" button in the event details that links to this URL
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.guest_list_enabled}
                  onChange={(e) => setFormData({ ...formData, guest_list_enabled: e.target.checked })}
                  className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-slate-700">Enable Guest List</span>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Allows guests to sign up for the guest list with SMS verification
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex items-center space-x-2 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>
                    {uploading ? 'Uploading...' : loading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <button
                type="button"
                onClick={saveCurrentEventAsTemplate}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Save as Template</span>
              </button>
            </div>
          </form>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Venue
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-slate-400">
                      <p className="text-lg font-medium mb-1">No events yet</p>
                      <p className="text-sm">Create your first event to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(event)}
                    className="hover:bg-slate-50 cursor-move"
                  >
                    <td className="px-4 py-3">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{event.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{event.venues?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(event)}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                          event.is_published
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {event.is_published ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCropModal && tempImageUrl && (
        <ImageCropModal
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
        />
      )}

    </div>
  );
}
