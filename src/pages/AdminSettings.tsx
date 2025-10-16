import { useEffect, useState } from 'react';
import { Save, Bell, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminSettings = {
  id: string;
  notification_phone: string | null;
  notification_enabled: boolean;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_from_phone: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromPhone, setTwilioFromPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setPhone(data.notification_phone || '');
        setEnabled(data.notification_enabled);
        setTwilioAccountSid(data.twilio_account_sid || '');
        setTwilioAuthToken(data.twilio_auth_token || '');
        setTwilioFromPhone(data.twilio_from_phone || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (settings) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            notification_phone: phone,
            notification_enabled: enabled,
            twilio_account_sid: twilioAccountSid,
            twilio_auth_token: twilioAuthToken,
            twilio_from_phone: twilioFromPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_settings').insert({
          notification_phone: phone,
          notification_enabled: enabled,
          twilio_account_sid: twilioAccountSid,
          twilio_auth_token: twilioAuthToken,
          twilio_from_phone: twilioFromPhone,
        });

        if (error) throw error;
      }

      setMessage('Settings saved successfully!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">SMS Notification Settings</h2>
            <p className="text-sm text-slate-600">Configure Twilio integration and SMS alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
              <li>Sign up for a Twilio account at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">twilio.com</a></li>
              <li>Get your Account SID and Auth Token from the Twilio Console Dashboard</li>
              <li>Get a phone number from Twilio (Console → Phone Numbers)</li>
              <li>Enter your Twilio credentials below</li>
              <li>Enter your phone number to receive notifications</li>
            </ol>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Twilio API Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account SID
                </label>
                <input
                  type="text"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder="AC..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Found in your Twilio Console Dashboard (starts with "AC")
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder="Your Twilio Auth Token"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Found in your Twilio Console Dashboard (click to reveal)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Twilio Phone Number
                </label>
                <input
                  type="tel"
                  value={twilioFromPhone}
                  onChange={(e) => setTwilioFromPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your Twilio phone number in E.164 format (e.g., +12125551234)
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-5 h-5 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-slate-700 font-medium">Enable SMS notifications</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Your Phone Number (to receive notifications)</span>
                  </div>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter phone number in E.164 format (e.g., +12125551234)
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes('success')
                  ? 'bg-slate-50 text-slate-700 border border-slate-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">How It Works</h3>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            When SMS notifications are enabled, you'll receive a text message every time someone
            submits a guest list request.
          </p>
          <p>The notification will include:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Guest name and contact information</li>
            <li>Event details and date</li>
            <li>Verification code for the guest</li>
          </ul>
          <p className="text-yellow-600 font-medium">
            Note: Standard SMS rates apply through your Twilio account.
          </p>
        </div>
      </div>
    </div>
  );
}
