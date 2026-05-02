import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Loader2, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: 'Home',
    door_no: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: null as number | null,
    lng: null as number | null,
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAddresses(data || []);
    } catch (err: any) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      showToast('error', 'Unsupported', 'Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        const addr = data.address || {};
        
        setAddressForm(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          street: addr.road || addr.suburb || addr.neighbourhood || '',
          city: addr.city || addr.town || addr.village || addr.county || '',
          state: addr.state || '',
          pincode: addr.postcode || ''
        }));
        
        showToast('success', 'Location Found', 'Your location has been fetched successfully.');
      } catch (err) {
        showToast('error', 'Geocoding Failed', 'Could not fetch address details for this location.');
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
      showToast('error', 'Location Error', error.message);
      setIsLocating(false);
    });
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('addresses').insert([{
        user_id: user.id,
        name: addressForm.name,
        door_no: addressForm.door_no,
        street: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        lat: addressForm.lat,
        lng: addressForm.lng,
        is_default: addresses.length === 0
      }]);

      if (error) throw error;
      
      showToast('success', 'Address Saved', 'Your new address has been added.');
      setIsAddingAddress(false);
      setAddressForm({ name: 'Home', door_no: '', street: '', city: '', state: '', pincode: '', lat: null, lng: null });
      fetchAddresses();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Removed', 'Address removed successfully');
      fetchAddresses();
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    }
  };
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mobile_number: profile.mobile_number || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          mobile_number: formData.mobile_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      showToast('success', 'Profile Updated', 'Your profile has been updated successfully.');
      setIsEditing(false);
      
      // Realtime update without full page reload
      await refreshProfile();
    } catch (error: any) {
      showToast('error', 'Update Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabButtonClass = (tabName: string) => {
    const baseClass = "w-full text-left px-4 py-3 rounded-md transition-colors ";
    return activeTab === tabName 
      ? baseClass + "bg-primary/10 text-primary font-medium" 
      : baseClass + "text-foreground/70 hover:bg-gray-50";
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">My Account</h1>
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Menu */}
        <div className="md:col-span-1 space-y-2">
          <button onClick={() => setActiveTab('profile')} className={getTabButtonClass('profile')}>Profile</button>
          <button onClick={() => setActiveTab('orders')} className={getTabButtonClass('orders')}>Orders</button>
          <button onClick={() => setActiveTab('addresses')} className={getTabButtonClass('addresses')}>Addresses</button>
          <button onClick={signOut} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md mt-4 transition-colors">Logout</button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Personal Information</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-primary font-medium hover:text-primary-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="first_name"
                    readOnly={!isEditing} 
                    value={formData.first_name} 
                    onChange={handleChange}
                    className={`w-full border border-gray-300 rounded-md px-4 py-3 ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white focus:ring-primary focus:border-primary'}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="last_name"
                    readOnly={!isEditing} 
                    value={formData.last_name} 
                    onChange={handleChange}
                    className={`w-full border border-gray-300 rounded-md px-4 py-3 ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white focus:ring-primary focus:border-primary'}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Mobile Number</label>
                  <input 
                    type="tel" 
                    name="mobile_number"
                    readOnly={!isEditing} 
                    value={formData.mobile_number} 
                    onChange={handleChange}
                    className={`w-full border border-gray-300 rounded-md px-4 py-3 ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white focus:ring-primary focus:border-primary'}`} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Email (Read Only)</label>
                  <input 
                    type="email" 
                    readOnly 
                    value={user?.email || ''} 
                    className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed border-transparent" 
                  />
                </div>
                
                {isEditing && (
                  <div className="col-span-2 flex gap-4 mt-2">
                    <button 
                      onClick={handleSave} 
                      disabled={isLoading}
                      className="bg-primary text-white font-medium py-3 px-8 rounded-md hover:bg-primary-600 disabled:opacity-70 transition-colors"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          first_name: profile?.first_name || '',
                          last_name: profile?.last_name || '',
                          mobile_number: profile?.mobile_number || '',
                        });
                      }} 
                      className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-8 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Order History
              </h2>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No orders yet</h3>
                  <p className="text-foreground/60 mb-6 max-w-sm">Explore our catalog and place your first order!</p>
                  <Link to="/category/all" className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-600 transition-colors">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusColors: Record<string, string> = {
                      Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      Processing: 'bg-blue-50 text-blue-700 border-blue-200',
                      Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
                      Delivered: 'bg-green-50 text-green-700 border-green-200',
                      Cancelled: 'bg-red-50 text-red-700 border-red-200',
                    };
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-foreground text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
                              <p className="text-xs text-foreground/50 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-foreground">₹{order.total_amount}</p>
                              <p className="text-xs text-foreground/50">{Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-gray-100 p-5 bg-gray-50">
                            <div className="space-y-3 mb-4">
                              {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white border border-gray-200" />}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-foreground/50">Qty: {item.quantity} × ₹{item.price}</p>
                                  </div>
                                  <p className="font-medium text-sm">₹{item.price * item.quantity}</p>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-foreground/60 pt-3 border-t border-gray-200">
                              <span>Payment: <strong className="text-foreground capitalize">{order.payment_method?.toUpperCase() || 'N/A'}</strong></span>
                              <span>Shipping: <strong className="text-foreground">{order.shipping_fee === 0 ? 'Free' : `₹${order.shipping_fee}`}</strong></span>
                              {order.shipping_address?.city && <span>To: <strong className="text-foreground">{order.shipping_address.city}, {order.shipping_address.pin}</strong></span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300 min-h-[400px]">
              {!isAddingAddress ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Saved Addresses</h2>
                    <button onClick={() => {
                      setIsAddingAddress(true);
                      if (!addressForm.lat) {
                        handleGetLocation();
                      }
                    }} className="text-primary font-medium hover:text-primary-600 transition-colors flex items-center gap-1">
                      <span className="text-xl leading-none -mt-1">+</span> Add New
                    </button>
                  </div>
                  
                  {addresses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-foreground/60">You haven't saved any addresses yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="border border-gray-200 rounded-lg p-5 relative transition-shadow hover:shadow-md">
                          {addr.is_default && <span className="absolute top-5 right-5 bg-gray-100 text-xs font-bold px-2 py-1 rounded text-foreground/60 uppercase">Default</span>}
                          <h3 className="font-bold text-foreground mb-1">{addr.name}</h3>
                          <p className="text-foreground/70 text-sm mb-4 leading-relaxed max-w-sm">
                            {addr.door_no && `${addr.door_no}, `}{addr.street}<br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <div className="flex gap-4">
                            <button className="text-sm font-bold text-primary hover:text-primary-600">Edit</button>
                            <button onClick={() => handleRemoveAddress(addr.id)} className="text-sm font-bold text-red-500 hover:text-red-600">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add New Address</h2>
                    <button onClick={() => setIsAddingAddress(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Cancel</button>
                  </div>

                  {addressForm.lat && addressForm.lng ? (
                    <div className="w-full h-48 bg-gray-100 rounded-lg mb-6 overflow-hidden relative border border-gray-200 shadow-inner">
                      <iframe 
                        key={`${addressForm.lat}-${addressForm.lng}`}
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${addressForm.lat},${addressForm.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-50 rounded-lg mb-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                      <MapPin className={`w-8 h-8 mb-2 ${isLocating ? 'animate-bounce text-primary opacity-100' : 'opacity-30'}`} />
                      <span className="text-sm font-medium">{isLocating ? 'Fetching your location...' : 'Map preview unavailable'}</span>
                      {!isLocating && <span className="text-xs mt-1">Click below to locate device</span>}
                    </div>
                  )}

                  <button 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 font-medium py-3 px-4 rounded-md hover:bg-blue-100 transition-colors mb-8 disabled:opacity-70 shadow-sm"
                  >
                    {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                    {isLocating ? 'Locating your device...' : 'Use Current Location'}
                  </button>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Save As (e.g. Home)</label>
                        <input type="text" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Door No / Flat</label>
                        <input type="text" value={addressForm.door_no} onChange={e => setAddressForm({...addressForm, door_no: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" placeholder="e.g. 104" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Street / Locality</label>
                      <input type="text" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" placeholder="Street Name" />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                        <input type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                        <input type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                      <input type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-primary focus:border-primary shadow-sm" />
                    </div>

                    <button 
                      onClick={handleSaveAddress}
                      disabled={isLoading || !addressForm.street || !addressForm.city}
                      className="w-full bg-primary text-white font-bold py-3.5 rounded-md hover:bg-primary-600 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isLoading ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export function Wishlist() {
  const { user, openAuthModal } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">Save your favorite items</h1>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto text-lg">Please sign in to view your wishlist and save items you love for later.</p>
        <button 
          onClick={openAuthModal}
          className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition-colors shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">My Wishlist</h1>
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
        <p className="text-foreground/60 mb-6">Explore our catalog and add items you love to your wishlist.</p>
        <Link to="/category/all" className="bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-600 transition-colors">
          Explore Products
        </Link>
      </div>
    </div>
  );
}
