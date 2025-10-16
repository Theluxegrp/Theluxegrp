import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, ZoomIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageZoomModal from './ImageZoomModal';

interface GuestListOption {
  id?: string;
  event_id: string;
  tier_name: string;
  display_name?: string;
  price: number;
  capacity: number;
  description: string;
  is_available: boolean;
  display_order?: number;
}

interface Section {
  id?: string;
  event_id: string;
  name: string;
  display_name?: string;
  capacity: number;
  minimum_spend: number;
  description: string;
  is_available: boolean;
  image_urls?: string[];
  display_order?: number;
}

interface BottlePackage {
  id?: string;
  event_id: string;
  name: string;
  display_name?: string;
  description: string;
  price: number;
  bottles_included: string[];
  serves: number;
  is_available: boolean;
  image_urls?: string[];
  display_order?: number;
}

interface EventOptionsManagerProps {
  eventId: string;
  eventName: string;
  guestListAvailable: boolean;
  sectionsAvailable: boolean;
  specialEventsAvailable: boolean;
  onClose: () => void;
  inline?: boolean;
}

export default function EventOptionsManager({
  eventId,
  eventName,
  guestListAvailable,
  sectionsAvailable,
  specialEventsAvailable,
  onClose,
  inline = false,
}: EventOptionsManagerProps) {
  const [activeTab, setActiveTab] = useState<'guest_list' | 'sections' | 'packages'>(
    guestListAvailable ? 'guest_list' : sectionsAvailable ? 'sections' : 'packages'
  );
  const [loading, setLoading] = useState(false);

  // Guest List Options
  const [guestListOptions, setGuestListOptions] = useState<GuestListOption[]>([]);
  const [editingGuestList, setEditingGuestList] = useState<string | null>(null);

  // Sections
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Bottle Packages
  const [bottlePackages, setBottlePackages] = useState<BottlePackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);

  // Image handling
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [uploadingPackage, setUploadingPackage] = useState<string | null>(null);
  const [tempSectionImages, setTempSectionImages] = useState<{[key: number]: string[]}>({});
  const [tempPackageImages, setTempPackageImages] = useState<{[key: number]: string[]}>({});

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [guestListRes, sectionsRes, packagesRes] = await Promise.all([
        supabase.from('guest_list_options').select('*').eq('event_id', eventId),
        supabase.from('sections').select('*').eq('event_id', eventId),
        supabase.from('bottle_packages').select('*').eq('event_id', eventId),
      ]);

      if (guestListRes.data) setGuestListOptions(guestListRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (packagesRes.data) setBottlePackages(packagesRes.data);
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Guest List Functions
  const addGuestListOption = () => {
    const newOption: GuestListOption = {
      event_id: eventId,
      tier_name: 'New Tier',
      price: 0,
      capacity: 50,
      description: '',
      is_available: true,
    };
    setGuestListOptions([...guestListOptions, newOption]);
    setEditingGuestList('new');
  };

  const saveGuestListOption = async (option: GuestListOption, index: number) => {
    try {
      if (option.id) {
        const { error } = await supabase
          .from('guest_list_options')
          .update(option)
          .eq('id', option.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('guest_list_options')
          .insert([option])
          .select()
          .single();
        if (error) throw error;
        const updated = [...guestListOptions];
        updated[index] = data;
        setGuestListOptions(updated);
      }
      setEditingGuestList(null);
    } catch (error) {
      console.error('Error saving guest list option:', error);
      alert('Failed to save guest list option');
    }
  };

  const toggleGuestListAvailability = async (option: GuestListOption, index: number) => {
    if (!option.id) return;

    try {
      const newValue = !option.is_available;
      const { error } = await supabase
        .from('guest_list_options')
        .update({ is_available: newValue })
        .eq('id', option.id);

      if (error) throw error;

      const updated = [...guestListOptions];
      updated[index].is_available = newValue;
      setGuestListOptions(updated);
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to toggle availability');
    }
  };

  const deleteGuestListOption = async (id: string | undefined, index: number) => {
    if (id) {
      try {
        const { error } = await supabase.from('guest_list_options').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting guest list option:', error);
        return;
      }
    }
    setGuestListOptions(guestListOptions.filter((_, i) => i !== index));
  };

  // Section Functions
  const addSection = () => {
    const newSection: Section = {
      event_id: eventId,
      name: 'New Section',
      capacity: 10,
      minimum_spend: 0,
      description: '',
      is_available: true,
    };
    setSections([...sections, newSection]);
    setEditingSection('new');
  };

  const saveSection = async (section: Section, index: number) => {
    try {
      let sectionId = section.id;

      if (section.id) {
        const { error } = await supabase.from('sections').update(section).eq('id', section.id);
        if (error) throw error;
      } else {
        const sectionData: any = {
          event_id: section.event_id,
          name: section.name,
          capacity: section.capacity,
          minimum_spend: section.minimum_spend,
          description: section.description,
          is_available: section.is_available,
        };
        const { data, error } = await supabase
          .from('sections')
          .insert([sectionData])
          .select()
          .single();
        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
        const updated = [...sections];
        updated[index] = data;
        setSections(updated);
        sectionId = data.id;
      }

      // Upload temp images if exist
      if (tempSectionImages[index] && tempSectionImages[index].length > 0 && sectionId) {
        for (const base64Data of tempSectionImages[index]) {
          const blob = await fetch(base64Data).then(r => r.blob());
          const file = new File([blob], `section-${sectionId}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          await handleSectionImageUpload(file, sectionId, index);
        }
        const updated = { ...tempSectionImages };
        delete updated[index];
        setTempSectionImages(updated);
      }

      setEditingSection(null);
    } catch (error: any) {
      console.error('Error saving section:', error);
      alert(`Failed to save section: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleSectionAvailability = async (section: Section, index: number) => {
    if (!section.id) return;

    try {
      const newValue = !section.is_available;
      const { error } = await supabase
        .from('sections')
        .update({ is_available: newValue })
        .eq('id', section.id);

      if (error) throw error;

      const updated = [...sections];
      updated[index].is_available = newValue;
      setSections(updated);
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to toggle availability');
    }
  };

  const deleteSection = async (id: string | undefined, index: number) => {
    if (id) {
      try {
        const { error } = await supabase.from('sections').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting section:', error);
        return;
      }
    }
    setSections(sections.filter((_, i) => i !== index));
  };

  // Bottle Package Functions
  const addBottlePackage = () => {
    const newPackage: BottlePackage = {
      event_id: eventId,
      name: 'New Package',
      description: '',
      price: 0,
      bottles_included: [''],
      serves: 4,
      is_available: true,
    };
    setBottlePackages([...bottlePackages, newPackage]);
    setEditingPackage('new');
  };

  const saveBottlePackage = async (pkg: BottlePackage, index: number) => {
    try {
      let packageId = pkg.id;

      if (pkg.id) {
        const { error } = await supabase.from('bottle_packages').update(pkg).eq('id', pkg.id);
        if (error) throw error;
      } else {
        const packageData: any = {
          event_id: pkg.event_id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          bottles_included: pkg.bottles_included,
          serves: pkg.serves,
          is_available: pkg.is_available,
        };
        const { data, error } = await supabase
          .from('bottle_packages')
          .insert([packageData])
          .select()
          .single();
        if (error) {
          console.error('Supabase error details:', error);
          throw error;
        }
        const updated = [...bottlePackages];
        updated[index] = data;
        setBottlePackages(updated);
        packageId = data.id;
      }

      // Upload temp images if exist
      if (tempPackageImages[index] && tempPackageImages[index].length > 0 && packageId) {
        for (const base64Data of tempPackageImages[index]) {
          const blob = await fetch(base64Data).then(r => r.blob());
          const file = new File([blob], `package-${packageId}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          await handlePackageImageUpload(file, packageId, index);
        }
        const updated = { ...tempPackageImages };
        delete updated[index];
        setTempPackageImages(updated);
      }

      setEditingPackage(null);
    } catch (error: any) {
      console.error('Error saving bottle package:', error);
      alert(`Failed to save bottle package: ${error.message || 'Unknown error'}`);
    }
  };

  const togglePackageAvailability = async (pkg: BottlePackage, index: number) => {
    if (!pkg.id) return;

    try {
      const newValue = !pkg.is_available;
      const { error } = await supabase
        .from('bottle_packages')
        .update({ is_available: newValue })
        .eq('id', pkg.id);

      if (error) throw error;

      const updated = [...bottlePackages];
      updated[index].is_available = newValue;
      setBottlePackages(updated);
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to toggle availability');
    }
  };

  const deleteBottlePackage = async (id: string | undefined, index: number) => {
    if (id) {
      try {
        const { error } = await supabase.from('bottle_packages').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting bottle package:', error);
        return;
      }
    }
    setBottlePackages(bottlePackages.filter((_, i) => i !== index));
  };

  // Image upload for sections
  const handleSectionImageUpload = async (file: File, sectionId: string, index: number) => {
    setUploadingSection(sectionId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `section-${sectionId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      const currentSection = sections[index];
      const currentUrls = currentSection.image_urls || [];
      const updatedUrls = [...currentUrls, publicUrl];

      const { error: updateError } = await supabase
        .from('sections')
        .update({ image_urls: updatedUrls })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      const updated = [...sections];
      updated[index].image_urls = updatedUrls;
      setSections(updated);
    } catch (error) {
      console.error('Error uploading section image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingSection(null);
    }
  };

  // Image upload for bottle packages
  const handlePackageImageUpload = async (file: File, packageId: string, index: number) => {
    setUploadingPackage(packageId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `package-${packageId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      const currentPackage = bottlePackages[index];
      const currentUrls = currentPackage.image_urls || [];
      const updatedUrls = [...currentUrls, publicUrl];

      const { error: updateError } = await supabase
        .from('bottle_packages')
        .update({ image_urls: updatedUrls })
        .eq('id', packageId);

      if (updateError) throw updateError;

      const updated = [...bottlePackages];
      updated[index].image_urls = updatedUrls;
      setBottlePackages(updated);
    } catch (error) {
      console.error('Error uploading package image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingPackage(null);
    }
  };

  const content = (
    <>
      <div className="border-b border-slate-200">
        <div className={inline ? "flex space-x-1" : "flex space-x-1 px-6"}>
            {guestListAvailable && (
              <button
                onClick={() => setActiveTab('guest_list')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'guest_list'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Guest List Options
              </button>
            )}
            {sectionsAvailable && (
              <button
                onClick={() => setActiveTab('sections')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'sections'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Table Sections
              </button>
            )}
            {specialEventsAvailable && (
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'packages'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Bottle Packages
              </button>
            )}
          </div>
        </div>

        <div className={inline ? "mt-4" : "flex-1 overflow-y-auto p-6"}>
          {activeTab === 'guest_list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Configure guest list pricing tiers and capacity</p>
                <button
                  onClick={addGuestListOption}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tier</span>
                </button>
              </div>

              {guestListOptions.map((option, index) => (
                <div key={option.id || index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {editingGuestList === option.id || editingGuestList === 'new' ? (
                    <>
                      <input
                        type="text"
                        value={option.tier_name}
                        onChange={(e) => {
                          const updated = [...guestListOptions];
                          updated[index].tier_name = e.target.value;
                          setGuestListOptions(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Tier Name"
                      />
                      <input
                        type="text"
                        value={option.display_name || ''}
                        onChange={(e) => {
                          const updated = [...guestListOptions];
                          updated[index].display_name = e.target.value;
                          setGuestListOptions(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Display Name (optional - shown to guests)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={option.price}
                          onChange={(e) => {
                            const updated = [...guestListOptions];
                            updated[index].price = parseFloat(e.target.value);
                            setGuestListOptions(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          value={option.capacity}
                          onChange={(e) => {
                            const updated = [...guestListOptions];
                            updated[index].capacity = parseInt(e.target.value);
                            setGuestListOptions(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Capacity"
                        />
                      </div>
                      <textarea
                        value={option.description}
                        onChange={(e) => {
                          const updated = [...guestListOptions];
                          updated[index].description = e.target.value;
                          setGuestListOptions(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                        rows={2}
                        placeholder="Description (optional)"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={option.is_available}
                          onChange={(e) => {
                            const updated = [...guestListOptions];
                            updated[index].is_available = e.target.checked;
                            setGuestListOptions(updated);
                          }}
                          className="w-4 h-4 text-yellow-500 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-700">Available</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveGuestListOption(option, index)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!option.id) {
                              deleteGuestListOption(undefined, index);
                            }
                            setEditingGuestList(null);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{option.display_name || option.tier_name}</h3>
                          {option.display_name && <p className="text-xs text-slate-500">Internal: {option.tier_name}</p>}
                          <p className="text-sm text-slate-600 mt-1">
                            ${option.price} • Capacity: {option.capacity}
                          </p>
                          {option.description && (
                            <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                          )}
                          <div className="mt-3 flex items-center space-x-2">
                            <span className="text-sm text-slate-700">Available:</span>
                            <button
                              onClick={() => toggleGuestListAvailability(option, index)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                option.is_available ? 'bg-green-500' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  option.is_available ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingGuestList(option.id || 'new')}
                            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGuestListOption(option.id, index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {guestListOptions.length === 0 && (
                <p className="text-center text-slate-400 py-8">No guest list tiers configured</p>
              )}
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Configure table sections and minimum spend</p>
                <button
                  onClick={addSection}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>

              {sections.map((section, index) => (
                <div key={section.id || index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {editingSection === section.id || editingSection === 'new' ? (
                    <>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[index].name = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Section Name"
                      />
                      <input
                        type="text"
                        value={section.display_name || ''}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[index].display_name = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Display Name (optional - shown to guests)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={section.capacity}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[index].capacity = parseInt(e.target.value);
                            setSections(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Capacity"
                        />
                        <input
                          type="number"
                          value={section.minimum_spend}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[index].minimum_spend = parseFloat(e.target.value);
                            setSections(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Minimum Spend"
                        />
                      </div>
                      <textarea
                        value={section.description}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[index].description = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                        rows={2}
                        placeholder="Description (optional)"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={section.is_available}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[index].is_available = e.target.checked;
                            setSections(updated);
                          }}
                          className="w-4 h-4 text-yellow-500 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-700">Available</span>
                      </label>

                      {/* Image Upload in Form */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Section Images</label>
                        {((tempSectionImages[index] && tempSectionImages[index].length > 0) || (section.image_urls && section.image_urls.length > 0)) && (
                          <div className="grid grid-cols-2 gap-2">
                            {(tempSectionImages[index] || []).map((url, imgIdx) => (
                              <div key={`temp-${imgIdx}`} className="relative group">
                                <img
                                  src={url}
                                  alt={`Preview ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...tempSectionImages };
                                    updated[index] = updated[index].filter((_, i) => i !== imgIdx);
                                    if (updated[index].length === 0) delete updated[index];
                                    setTempSectionImages(updated);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {(section.image_urls || []).map((url, imgIdx) => (
                              <div key={`saved-${imgIdx}`} className="relative group">
                                <img
                                  src={url}
                                  alt={`Saved ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSections = [...sections];
                                    updatedSections[index].image_urls = updatedSections[index].image_urls?.filter((_, i) => i !== imgIdx);
                                    setSections(updatedSections);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          id={`section-form-upload-${index}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTempSectionImages(prev => ({
                                  ...prev,
                                  [index]: [...(prev[index] || []), reader.result as string]
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`section-form-upload-${index}`)?.click()}
                          className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Add Images</span>
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveSection(section, index)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!section.id) {
                              deleteSection(undefined, index);
                            }
                            setEditingSection(null);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {section.image_urls && section.image_urls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {section.image_urls.map((url, imgIdx) => (
                              <div key={imgIdx} className="relative group">
                                <img
                                  src={url}
                                  alt={`${section.name} ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  onClick={() => setZoomImage(url)}
                                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900">{section.display_name || section.name}</h3>
                            {section.display_name && <p className="text-xs text-slate-500">Internal: {section.name}</p>}
                            <p className="text-sm text-slate-600 mt-1">
                              Capacity: {section.capacity} • Min Spend: ${section.minimum_spend}
                            </p>
                            {section.description && (
                              <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                            )}
                            <div className="mt-3 flex items-center space-x-2">
                              <span className="text-sm text-slate-700">Available:</span>
                              <button
                                onClick={() => toggleSectionAvailability(section, index)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  section.is_available ? 'bg-green-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    section.is_available ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        <div className="flex space-x-2">
                          <input
                            id={`section-upload-${section.id || 'new'}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && section.id) {
                                handleSectionImageUpload(file, section.id, index);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!section.id) {
                                alert('Please save this section first before uploading an image');
                                return;
                              }
                              document.getElementById(`section-upload-${section.id}`)?.click();
                            }}
                            disabled={uploadingSection === section.id || !section.id}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                            title={section.id ? "Upload Image" : "Save section first to upload image"}
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSection(section.id || 'new')}
                            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(section.id, index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {sections.length === 0 && (
                <p className="text-center text-slate-400 py-8">No table sections configured</p>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Configure bottle service packages</p>
                <button
                  onClick={addBottlePackage}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Package</span>
                </button>
              </div>

              {bottlePackages.map((pkg, index) => (
                <div key={pkg.id || index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  {editingPackage === pkg.id || editingPackage === 'new' ? (
                    <>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => {
                          const updated = [...bottlePackages];
                          updated[index].name = e.target.value;
                          setBottlePackages(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Package Name"
                      />
                      <input
                        type="text"
                        value={pkg.display_name || ''}
                        onChange={(e) => {
                          const updated = [...bottlePackages];
                          updated[index].display_name = e.target.value;
                          setBottlePackages(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Display Name (optional - shown to guests)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => {
                            const updated = [...bottlePackages];
                            updated[index].price = parseFloat(e.target.value);
                            setBottlePackages(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          value={pkg.serves}
                          onChange={(e) => {
                            const updated = [...bottlePackages];
                            updated[index].serves = parseInt(e.target.value);
                            setBottlePackages(updated);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Serves"
                        />
                      </div>
                      <textarea
                        value={pkg.description}
                        onChange={(e) => {
                          const updated = [...bottlePackages];
                          updated[index].description = e.target.value;
                          setBottlePackages(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                        rows={2}
                        placeholder="Description"
                      />
                      <textarea
                        value={pkg.bottles_included.join('\n')}
                        onChange={(e) => {
                          const updated = [...bottlePackages];
                          updated[index].bottles_included = e.target.value.split('\n').filter(b => b.trim());
                          setBottlePackages(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                        rows={3}
                        placeholder="Bottles included (one per line)"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={pkg.is_available}
                          onChange={(e) => {
                            const updated = [...bottlePackages];
                            updated[index].is_available = e.target.checked;
                            setBottlePackages(updated);
                          }}
                          className="w-4 h-4 text-yellow-500 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-700">Available</span>
                      </label>

                      {/* Image Upload in Form */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Package Images</label>
                        {((tempPackageImages[index] && tempPackageImages[index].length > 0) || (pkg.image_urls && pkg.image_urls.length > 0)) && (
                          <div className="grid grid-cols-2 gap-2">
                            {(tempPackageImages[index] || []).map((url, imgIdx) => (
                              <div key={`temp-${imgIdx}`} className="relative group">
                                <img
                                  src={url}
                                  alt={`Preview ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...tempPackageImages };
                                    updated[index] = updated[index].filter((_, i) => i !== imgIdx);
                                    if (updated[index].length === 0) delete updated[index];
                                    setTempPackageImages(updated);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {(pkg.image_urls || []).map((url, imgIdx) => (
                              <div key={`saved-${imgIdx}`} className="relative group">
                                <img
                                  src={url}
                                  alt={`Saved ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedPackages = [...bottlePackages];
                                    updatedPackages[index].image_urls = updatedPackages[index].image_urls?.filter((_, i) => i !== imgIdx);
                                    setBottlePackages(updatedPackages);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          id={`package-form-upload-${index}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTempPackageImages(prev => ({
                                  ...prev,
                                  [index]: [...(prev[index] || []), reader.result as string]
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`package-form-upload-${index}`)?.click()}
                          className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Add Images</span>
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveBottlePackage(pkg, index)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!pkg.id) {
                              deleteBottlePackage(undefined, index);
                            }
                            setEditingPackage(null);
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {pkg.image_urls && pkg.image_urls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {pkg.image_urls.map((url, imgIdx) => (
                              <div key={imgIdx} className="relative group">
                                <img
                                  src={url}
                                  alt={`${pkg.name} ${imgIdx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setZoomImage(url)}
                                />
                                <button
                                  onClick={() => setZoomImage(url)}
                                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900">{pkg.display_name || pkg.name}</h3>
                            {pkg.display_name && <p className="text-xs text-slate-500">Internal: {pkg.name}</p>}
                            <p className="text-sm text-slate-600 mt-1">
                              ${pkg.price} • Serves {pkg.serves}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">{pkg.description}</p>
                            <ul className="text-sm text-slate-500 mt-2 list-disc list-inside">
                              {pkg.bottles_included.map((bottle, i) => (
                                <li key={i}>{bottle}</li>
                              ))}
                            </ul>
                            <div className="mt-3 flex items-center space-x-2">
                              <span className="text-sm text-slate-700">Available:</span>
                              <button
                                onClick={() => togglePackageAvailability(pkg, index)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  pkg.is_available ? 'bg-green-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    pkg.is_available ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <input
                              id={`package-upload-${pkg.id || 'new'}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && pkg.id) {
                                  handlePackageImageUpload(file, pkg.id, index);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (!pkg.id) {
                                  alert('Please save this package first before uploading an image');
                                  return;
                                }
                                document.getElementById(`package-upload-${pkg.id}`)?.click();
                              }}
                              disabled={uploadingPackage === pkg.id || !pkg.id}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                              title={pkg.id ? "Upload Image" : "Save package first to upload image"}
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingPackage(pkg.id || 'new')}
                              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBottlePackage(pkg.id, index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {bottlePackages.length === 0 && (
                <p className="text-center text-slate-400 py-8">No bottle packages configured</p>
              )}
            </div>
          )}
        </div>
    </>
  );

  if (inline) {
    return (
      <>
        <div>{content}</div>
        {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manage Event Options</h2>
              <p className="text-sm text-slate-600 mt-1">{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
        </div>
      </div>
      {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}
    </>
  );
}
