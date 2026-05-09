import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { Store, Briefcase, Mail, Phone, MapPin, Building, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const JoinForm = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    pan_number: '',
    bank_account_name: '',
    bank_account_number: '',
    ifsc_code: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('seller_applications').insert([
        {
          ...formData,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      showToast('success', 'Success', 'Application submitted successfully! We will review and contact you soon.');
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      showToast('error', 'Error', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-12 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-amber-900 mb-4 tracking-wide">Join Swaxthika as a Seller</h2>
          <p className="text-stone-600 text-lg">Partner with us to bring authentic spiritual and religious products to our community.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl shadow-stone-200/50 rounded-2xl p-8 space-y-12 border border-stone-100">
          
          {/* Business Information */}
          <section>
            <h3 className="text-xl font-medium text-amber-800 border-b border-amber-100 pb-3 mb-6 flex items-center gap-2">
              <Store className="w-5 h-5" /> Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-stone-700 mb-2">Business Name / Store Name *</label>
                <input required type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" placeholder="Enter your business name" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-stone-700 mb-2">Business Type *</label>
                <select name="business_type" value={formData.business_type} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none">
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="partnership">Partnership</option>
                  <option value="company">Private Limited / Company</option>
                  <option value="artisan">Artisan / Craftsman</option>
                </select>
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <section>
            <h3 className="text-xl font-medium text-amber-800 border-b border-amber-100 pb-3 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">Owner's Full Name *</label>
                <input required type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-stone-400 absolute left-3 top-3.5" />
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-stone-400 absolute left-3 top-3.5" />
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" placeholder="+91 xxxxx xxxxx" />
                </div>
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section>
            <h3 className="text-xl font-medium text-amber-800 border-b border-amber-100 pb-3 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">Complete Address *</label>
                <textarea required name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none" placeholder="Street address, building, etc."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">City *</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">State *</label>
                <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">PIN Code *</label>
                <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
              </div>
            </div>
          </section>

          {/* Tax & Banking Details */}
          <section>
            <h3 className="text-xl font-medium text-amber-800 border-b border-amber-100 pb-3 mb-6 flex items-center gap-2">
              <Building className="w-5 h-5" /> Tax & Banking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">GST Number (Optional)</label>
                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none uppercase" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">PAN Number *</label>
                <input required type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none uppercase" placeholder="ABCDE1234F" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">Bank Account Name *</label>
                <input required type="text" name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" placeholder="Name as per bank records" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Account Number *</label>
                <input required type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">IFSC Code *</label>
                <input required type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none uppercase" />
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-amber-900 text-white rounded-lg hover:bg-amber-950 font-medium tracking-wide shadow-lg shadow-amber-900/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Submit Application'}
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
