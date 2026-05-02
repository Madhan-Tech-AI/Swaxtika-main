import { ShieldCheck, CreditCard, Wallet, Truck, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function Checkout() {
  const { user, requireAuth } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressData, setAddressData] = useState({
    fullName: '', phone: '', email: '', address: '', city: '', pin: ''
  });

  useEffect(() => {
    requireAuth(() => {
      fetchCartItems();
    });
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          products:product_id (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // If cart is empty, redirect back to cart
      if (!data || data.length === 0) {
        navigate('/cart');
        return;
      }
      
      setCartItems(data);
    } catch (err) {
      console.error('Error fetching cart for checkout:', err);
      showToast('error', 'Error', 'Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = () => {
    const errors: Record<string, string> = {};
    if (!addressData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addressData.phone.trim() || addressData.phone.length < 10) errors.phone = 'Valid phone number is required';
    if (!addressData.address.trim()) errors.address = 'Address is required';
    if (!addressData.city.trim()) errors.city = 'City is required';
    if (!addressData.pin.trim() || addressData.pin.length < 6) errors.pin = 'Valid PIN code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveContinue = () => {
    if (validateAddress()) {
      setAddressComplete(true);
      showToast('success', 'Address Saved', 'Please choose your payment method.');
    }
  };

  const handlePlaceOrder = async (e: React.MouseEvent) => {
    if (!addressComplete) {
      showToast('error', 'Address Required', 'Please complete and save your address first.');
      return;
    }
    if (!paymentMethod) {
      showToast('error', 'Payment Required', 'Please select a payment method.');
      return;
    }
    e.preventDefault();
    setPlacingOrder(true);

    try {
      const subtotalVal = cartItems.reduce((acc: number, item: any) => acc + (item.products.price * item.quantity), 0);
      const shippingVal = subtotalVal > 1000 || subtotalVal === 0 ? 0 : 150;
      const totalVal = subtotalVal + shippingVal;

      // Build order items array
      const orderItems = cartItems.map((item: any) => ({
        product_id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        quantity: item.quantity,
        image: item.products.image || null,
      }));

      // Insert order into DB
      const { error: orderError } = await supabase.from('orders').insert([{
        user_id: user!.id,
        customer_name: addressData.fullName,
        customer_email: addressData.email || user!.email,
        customer_phone: addressData.phone,
        shipping_address: addressData,
        items: orderItems,
        subtotal: subtotalVal,
        shipping_fee: shippingVal,
        total_amount: totalVal,
        payment_method: paymentMethod,
        status: 'Pending',
      }]);

      if (orderError) throw orderError;

      // Clear cart
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user!.id);

      if (cartError) throw cartError;

      showToast('success', 'Order Placed! 🎉', 'Your order has been placed. Track it in My Orders.');
      navigate('/account');
    } catch (err: any) {
      console.error('Error placing order:', err);
      showToast('error', 'Order Failed', err.message || 'Could not place order at this time.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const subtotal = cartItems.reduce((acc, item) => acc + (item.products.price * item.quantity), 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold text-foreground">Secure Checkout</h1>
        <p className="text-foreground/60 mt-2">Complete your purchase securely</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
        {/* Checkout Forms */}
        <div className="lg:w-2/3 space-y-8">
          
          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
              Delivery Address
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Full Name</label>
                <input type="text" value={addressData.fullName} onChange={e => setAddressData(p=>({...p, fullName: e.target.value}))} className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${formErrors.fullName ? 'border-red-400' : 'border-gray-300'}`} placeholder="e.g. Ramesh Kumar" />
                {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Phone Number</label>
                <input type="tel" value={addressData.phone} onChange={e => setAddressData(p=>({...p, phone: e.target.value}))} className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${formErrors.phone ? 'border-red-400' : 'border-gray-300'}`} placeholder="+91 98765 43210" />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Email Address</label>
                <input type="email" value={addressData.email} onChange={e => setAddressData(p=>({...p, email: e.target.value}))} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="ramesh@example.com" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Address (House No, Building, Street)</label>
                <input type="text" value={addressData.address} onChange={e => setAddressData(p=>({...p, address: e.target.value}))} className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${formErrors.address ? 'border-red-400' : 'border-gray-300'}`} placeholder="" />
                {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground/80 mb-2">City</label>
                <input type="text" value={addressData.city} onChange={e => setAddressData(p=>({...p, city: e.target.value}))} className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${formErrors.city ? 'border-red-400' : 'border-gray-300'}`} placeholder="" />
                {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-foreground/80 mb-2">PIN Code</label>
                <input type="text" value={addressData.pin} onChange={e => setAddressData(p=>({...p, pin: e.target.value}))} maxLength={6} className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${formErrors.pin ? 'border-red-400' : 'border-gray-300'}`} placeholder="" />
                {formErrors.pin && <p className="text-xs text-red-500 mt-1">{formErrors.pin}</p>}
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <button onClick={handleSaveContinue} className="bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-600 transition-colors">
                {addressComplete ? '✓ Address Saved' : 'Save & Continue'}
              </button>
              {addressComplete && (
                <span className="text-green-600 text-sm font-medium">Address confirmed. Please select a payment method below.</span>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 transition-opacity duration-300 ${addressComplete ? '' : 'opacity-60 pointer-events-none'}`}>
            <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${addressComplete ? 'bg-primary text-white' : 'bg-gray-300 text-foreground/50'}`}>2</span>
              Payment Method
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors" style={{borderColor: paymentMethod === 'upi' ? 'var(--color-primary)' : ''}}>
                <div className="flex items-center gap-4">
                  <input type="radio" name="payment" value="upi" onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary focus:ring-primary accent-primary" />
                  <span className="font-medium text-foreground">UPI (GPay, PhonePe, Paytm)</span>
                </div>
                <Wallet className="w-6 h-6 text-foreground/50" />
              </label>
              <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors" style={{borderColor: paymentMethod === 'card' ? 'var(--color-primary)' : ''}}>
                <div className="flex items-center gap-4">
                  <input type="radio" name="payment" value="card" onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary focus:ring-primary accent-primary" />
                  <span className="font-medium text-foreground">Credit / Debit Card</span>
                </div>
                <CreditCard className="w-6 h-6 text-foreground/50" />
              </label>
              <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors" style={{borderColor: paymentMethod === 'cod' ? 'var(--color-primary)' : ''}}>
                <div className="flex items-center gap-4">
                  <input type="radio" name="payment" value="cod" onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary focus:ring-primary accent-primary" />
                  <span className="font-medium text-foreground">Cash on Delivery</span>
                </div>
                <Truck className="w-6 h-6 text-foreground/50" />
              </label>
            </div>
          </div>

        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 sticky top-28">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 divide-y divide-gray-200 max-h-96 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 py-4">
                  <img src={item.products.image || 'https://via.placeholder.com/100'} alt={item.products.name} className="w-16 h-16 rounded object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground line-clamp-2">{item.products.name}</h4>
                    <p className="text-sm text-foreground/60 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium">₹{item.products.price * item.quantity}</div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 py-4 border-t border-gray-200">
              <div className="flex justify-between text-foreground/80 text-sm">
                <span>Subtotal</span>
                <span className="font-medium">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-foreground/80 text-sm">
                <span>Shipping</span>
                <span className="font-medium text-green-600">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-foreground">Total to Pay</span>
                <span className="text-2xl font-bold text-foreground">₹{total}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full h-14 bg-primary text-white font-medium text-lg rounded-md flex items-center justify-center hover:bg-primary-600 transition-colors shadow-sm hover:shadow-premium transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {placingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
            </button>
            <p className="text-center text-xs text-foreground/50 mt-4">Complete your address to proceed</p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-foreground/70 mb-3">
                <ShieldCheck className="w-5 h-5 text-green-600" /> Safe and Secure Payments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
