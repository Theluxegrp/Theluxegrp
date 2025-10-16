import { useState } from 'react';
import { Users, Share2, CheckCircle, Loader, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GuestListFormProps = {
  eventId: string;
  eventName: string;
  onClose: () => void;
};

export default function GuestListForm({ eventId, eventName, onClose }: GuestListFormProps) {
  const [step, setStep] = useState<'form' | 'verification' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entryId, setEntryId] = useState('');
  const [currentConfirmationCode, setCurrentConfirmationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    try {
      const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);

      const { data, error: insertError } = await supabase
        .from('guest_list_entries')
        .insert({
          event_id: eventId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formattedPhone,
          confirmation_code: confirmationCode,
          is_confirmed: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEntryId(data.id);
      setCurrentConfirmationCode(confirmationCode);

      console.log('Attempting to send SMS to:', formattedPhone);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-guest-list-sms`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          code: confirmationCode,
          eventName: eventName,
        }),
      });

      console.log('Response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('SMS Response:', responseData);
        console.log('SMS Success:', responseData.success);
        console.log('SMS Message:', responseData.message);
        if (responseData.error) console.log('SMS Error:', responseData.error);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response:', textResponse);
        throw new Error('Invalid response from SMS service');
      }

      if (!response.ok) {
        console.error('SMS sending failed:', responseData);
        throw new Error(responseData.message || 'Failed to send verification SMS');
      }

      if (!responseData.success) {
        console.warn('SMS not sent:', responseData.message);
        setError(`SMS not sent: ${responseData.message}`);
      }

      setStep('verification');
      startResendCooldown();
    } catch (err) {
      console.error('Error submitting guest list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);

      const { error: updateError } = await supabase
        .from('guest_list_entries')
        .update({ confirmation_code: newCode })
        .eq('id', entryId);

      if (updateError) throw updateError;

      setCurrentConfirmationCode(newCode);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-guest-list-sms`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          code: newCode,
          eventName: eventName,
        }),
      });

      const responseData = await response.json();
      console.log('SMS Resend Response:', responseData);

      if (!response.ok) {
        console.error('SMS resending failed:', responseData);
        throw new Error(responseData.message || 'Failed to resend verification SMS');
      }

      if (!responseData.success) {
        console.warn('SMS not resent:', responseData.message);
      }

      startResendCooldown();
      setError('');
    } catch (err) {
      console.error('Error resending code:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: entry, error: fetchError } = await supabase
        .from('guest_list_entries')
        .select('confirmation_code')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      if (entry.confirmation_code !== verificationCode) {
        setError('Invalid verification code');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('guest_list_entries')
        .update({
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      setStep('success');
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${window.location.protocol}//${window.location.host}/?guestlist=${eventId}`;

  const handleShare = async () => {
    const shareMessage = `Join the guest list for ${eventName}! Sign up here: ${shareUrl}`;
    console.log('Sharing URL:', shareUrl);
    console.log('Event ID:', eventId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join the Guest List for ${eventName}`,
          text: shareMessage,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          fallbackToSMS();
        }
      }
    } else {
      fallbackToSMS();
    }
  };

  const fallbackToSMS = () => {
    const shareMessage = `Join the guest list for ${eventName}! Sign up here: ${shareUrl}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(shareMessage)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto p-8">
          {step === 'form' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Guest List Sign Up</h3>
              <p className="text-sm text-slate-600 mt-2">{eventName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                  <span className="text-xs text-slate-500 ml-2">Valid Number needed for Confirmation Text</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-5 h-5 animate-spin" />
                    </span>
                  ) : (
                    'Submit'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share this form with a Friend</span>
              </button>
            </form>
          </>
        )}

        {step === 'verification' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Verify Your Phone</h3>
              <p className="text-sm text-slate-600 mt-2">
                We sent a 6-digit code to {formData.phoneNumber}
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-5 h-5 animate-spin" />
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Back
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : 'Resend Code'}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the List!</h3>
            <p className="text-slate-600 mb-6">
              {formData.firstName}, you've been successfully added to the guest list for {eventName}.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
