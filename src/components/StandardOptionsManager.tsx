import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StandardOption {
  id: string;
  name: string;
  display_name: string;
  description: string;
  display_order: number;
}

interface EventStandardOption {
  id?: string;
  event_id: string;
  standard_option_id: string;
  is_enabled: boolean;
  booking_mode: 'instant' | 'request';
  instructions: string;
}

interface TableServiceOption {
  id?: string;
  event_id: string;
  standard_option_id: string;
  name: string;
  display_name?: string;
  description: string;
  price: number;
  minimum_spend: number;
  capacity?: number;
  image_urls?: string[];
  display_order: number;
  is_available: boolean;
}

interface StandardOptionsManagerProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

export default function StandardOptionsManager({
  eventId,
  eventName,
  onClose,
}: StandardOptionsManagerProps) {
  const [standardOptions, setStandardOptions] = useState<StandardOption[]>([]);
  const [eventOptions, setEventOptions] = useState<EventStandardOption[]>([]);
  const [tableServiceOptions, setTableServiceOptions] = useState<TableServiceOption[]>([]);
  const [selectedStandardOption, setSelectedStandardOption] = useState<string | null>(null);
  const [editingTableService, setEditingTableService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load standard options
      const { data: standardData } = await supabase
        .from('standard_reservation_options')
        .select('*')
        .order('display_order');

      if (standardData) setStandardOptions(standardData);

      // Load event standard options
      const { data: eventOptionsData } = await supabase
        .from('event_standard_options')
        .select('*')
        .eq('event_id', eventId);

      if (eventOptionsData) {
        setEventOptions(eventOptionsData);
      } else {
        // Initialize with all options disabled
        setEventOptions([]);
      }

      // Load table service options
      const { data: tableServiceData } = await supabase
        .from('table_service_options')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order');

      if (tableServiceData) setTableServiceOptions(tableServiceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStandardOption = async (standardOptionId: string, enabled: boolean) => {
    const existing = eventOptions.find(eo => eo.standard_option_id === standardOptionId);

    if (existing) {
      const { error } = await supabase
        .from('event_standard_options')
        .update({ is_enabled: enabled })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('event_standard_options')
        .insert({
          event_id: eventId,
          standard_option_id: standardOptionId,
          is_enabled: enabled,
          booking_mode: 'instant',
          instructions: '',
        });

      if (error) {
        console.error('Error inserting:', error);
        return;
      }
    }

    loadData();
  };

  const isOptionEnabled = (standardOptionId: string) => {
    const option = eventOptions.find(eo => eo.standard_option_id === standardOptionId);
    return option?.is_enabled || false;
  };

  const addTableServiceOption = () => {
    if (!selectedStandardOption) return;

    const newOption: TableServiceOption = {
      event_id: eventId,
      standard_option_id: selectedStandardOption,
      name: 'New Option',
      description: '',
      price: 0,
      minimum_spend: 0,
      display_order: tableServiceOptions.length,
      is_available: true,
    };
    setTableServiceOptions([...tableServiceOptions, newOption]);
    setEditingTableService('new');
  };

  const saveTableServiceOption = async (option: TableServiceOption, index: number) => {
    try {
      if (option.id) {
        const { error } = await supabase
          .from('table_service_options')
          .update(option)
          .eq('id', option.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('table_service_options')
          .insert([option])
          .select()
          .single();
        if (error) throw error;
        const updated = [...tableServiceOptions];
        updated[index] = data;
        setTableServiceOptions(updated);
      }
      setEditingTableService(null);
    } catch (error) {
      console.error('Error saving table service option:', error);
      alert('Failed to save option');
    }
  };

  const deleteTableServiceOption = async (id: string | undefined, index: number) => {
    if (id) {
      try {
        const { error } = await supabase.from('table_service_options').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting:', error);
        return;
      }
    }
    setTableServiceOptions(tableServiceOptions.filter((_, i) => i !== index));
  };

  const getFilteredTableServices = () => {
    if (!selectedStandardOption) return [];
    return tableServiceOptions.filter(
      ts => ts.standard_option_id === selectedStandardOption
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Reservation Options</h2>
            <p className="text-sm text-slate-600 mt-1">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Standard Options Toggles */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Standard Reservation Options</h3>
              <p className="text-sm text-slate-600 mb-4">
                Toggle which reservation options are available for this event
              </p>

              <div className="space-y-3">
                {standardOptions.map(option => (
                  <div
                    key={option.id}
                    className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{option.display_name}</h4>
                      <p className="text-sm text-slate-600">{option.description}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOptionEnabled(option.id)}
                          onChange={(e) => toggleStandardOption(option.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                      </label>

                      {isOptionEnabled(option.id) && option.name !== 'guest_list' && (
                        <button
                          onClick={() => setSelectedStandardOption(
                            selectedStandardOption === option.id ? null : option.id
                          )}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedStandardOption === option.id
                              ? 'bg-yellow-500 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Manage Options
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Service Options */}
            {selectedStandardOption && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Table Service Options</h3>
                    <p className="text-sm text-slate-600">
                      Configure options for {standardOptions.find(o => o.id === selectedStandardOption)?.display_name}
                    </p>
                  </div>
                  <button
                    onClick={addTableServiceOption}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {getFilteredTableServices().map((option, index) => (
                    <div key={option.id || index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                      {editingTableService === option.id || editingTableService === 'new' ? (
                        <>
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const updated = [...tableServiceOptions];
                              const globalIndex = tableServiceOptions.findIndex(
                                ts => ts === option
                              );
                              updated[globalIndex].name = e.target.value;
                              setTableServiceOptions(updated);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Option Name"
                          />
                          <input
                            type="text"
                            value={option.display_name || ''}
                            onChange={(e) => {
                              const updated = [...tableServiceOptions];
                              const globalIndex = tableServiceOptions.findIndex(
                                ts => ts === option
                              );
                              updated[globalIndex].display_name = e.target.value;
                              setTableServiceOptions(updated);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Display Name (optional)"
                          />
                          <textarea
                            value={option.description}
                            onChange={(e) => {
                              const updated = [...tableServiceOptions];
                              const globalIndex = tableServiceOptions.findIndex(
                                ts => ts === option
                              );
                              updated[globalIndex].description = e.target.value;
                              setTableServiceOptions(updated);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                            rows={2}
                            placeholder="Description"
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) => {
                                const updated = [...tableServiceOptions];
                                const globalIndex = tableServiceOptions.findIndex(
                                  ts => ts === option
                                );
                                updated[globalIndex].price = parseFloat(e.target.value);
                                setTableServiceOptions(updated);
                              }}
                              className="px-3 py-2 border border-slate-300 rounded-lg"
                              placeholder="Price"
                            />
                            <input
                              type="number"
                              value={option.minimum_spend}
                              onChange={(e) => {
                                const updated = [...tableServiceOptions];
                                const globalIndex = tableServiceOptions.findIndex(
                                  ts => ts === option
                                );
                                updated[globalIndex].minimum_spend = parseFloat(e.target.value);
                                setTableServiceOptions(updated);
                              }}
                              className="px-3 py-2 border border-slate-300 rounded-lg"
                              placeholder="Min Spend"
                            />
                            <input
                              type="number"
                              value={option.capacity || ''}
                              onChange={(e) => {
                                const updated = [...tableServiceOptions];
                                const globalIndex = tableServiceOptions.findIndex(
                                  ts => ts === option
                                );
                                updated[globalIndex].capacity = e.target.value ? parseInt(e.target.value) : undefined;
                                setTableServiceOptions(updated);
                              }}
                              className="px-3 py-2 border border-slate-300 rounded-lg"
                              placeholder="Capacity"
                            />
                          </div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={option.is_available}
                              onChange={(e) => {
                                const updated = [...tableServiceOptions];
                                const globalIndex = tableServiceOptions.findIndex(
                                  ts => ts === option
                                );
                                updated[globalIndex].is_available = e.target.checked;
                                setTableServiceOptions(updated);
                              }}
                              className="w-4 h-4 text-yellow-500 border-slate-300 rounded"
                            />
                            <span className="text-sm text-slate-700">Available</span>
                          </label>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const globalIndex = tableServiceOptions.findIndex(
                                  ts => ts === option
                                );
                                saveTableServiceOption(option, globalIndex);
                              }}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => {
                                if (!option.id) {
                                  const globalIndex = tableServiceOptions.findIndex(
                                    ts => ts === option
                                  );
                                  deleteTableServiceOption(undefined, globalIndex);
                                }
                                setEditingTableService(null);
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
                              <h4 className="font-medium text-slate-900">
                                {option.display_name || option.name}
                              </h4>
                              {option.display_name && (
                                <p className="text-xs text-slate-500">Internal: {option.name}</p>
                              )}
                              <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                                {option.price > 0 && <span>Price: ${option.price}</span>}
                                {option.minimum_spend > 0 && <span>Min Spend: ${option.minimum_spend}</span>}
                                {option.capacity && <span>Capacity: {option.capacity}</span>}
                              </div>
                              <span
                                className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                                  option.is_available
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {option.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingTableService(option.id || 'new')}
                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const globalIndex = tableServiceOptions.findIndex(
                                    ts => ts === option
                                  );
                                  deleteTableServiceOption(option.id, globalIndex);
                                }}
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

                  {getFilteredTableServices().length === 0 && (
                    <p className="text-center text-slate-400 py-8">No options configured</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
