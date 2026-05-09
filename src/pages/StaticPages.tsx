import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Truck, CheckCircle2, Clock, MapPin, Loader2, Search, Box, CircleDot } from 'lucide-react';

const TRACKING_STEPS = [
  { key: 'Pending', label: 'Order Placed', desc: 'Your order has been placed successfully', icon: Package },
  { key: 'Processing', label: 'Processing', desc: 'Seller is preparing your order', icon: Box },
  { key: 'Shipped', label: 'Shipped', desc: 'Your order is on the way', icon: Truck },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Your order is out for delivery', icon: MapPin },
  { key: 'Delivered', label: 'Delivered', desc: 'Order delivered successfully', icon: CheckCircle2 },
];

export function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Auto-search if orderId is in URL
  useEffect(() => {
    const urlId = searchParams.get('orderId');
    if (urlId) { setOrderId(urlId); }
  }, [searchParams]);

  const handleTrack = async () => {
    if (!orderId.trim()) { setError('Please enter your Order ID'); return; }
    if (!phone.trim() || phone.trim().length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);

    try {
      // Search by matching the start of the UUID with the short order ID
      const { data: orders, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      // Match order by short ID prefix and phone
      const cleanId = orderId.replace('#', '').trim().toLowerCase();
      const cleanPhone = phone.trim().replace(/\s/g, '').replace('+91', '');

      const matched = (orders || []).find((o: any) => {
        const shortId = o.id.split('-')[0].toLowerCase();
        const orderPhone = (o.customer_phone || '').replace(/\s/g, '').replace('+91', '');
        return shortId === cleanId && orderPhone.endsWith(cleanPhone.slice(-10));
      });

      if (matched) {
        setOrder(matched);
      } else {
        setError('No order found. Please check your Order ID and mobile number.');
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.status === 'Cancelled') return -1;
    const idx = TRACKING_STEPS.findIndex(s => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  const getEstimatedDelivery = () => {
    if (!order) return '';
    const created = new Date(order.created_at);
    const est = new Date(created.getTime() + 5 * 86400000);
    return est.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Track Your Order</h1>
      <p className="text-foreground/60 mb-8">Enter your Order ID and registered mobile number to view real-time tracking.</p>

      {/* Search Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Order ID</label>
            <div className="relative">
              <input
                type="text"
                value={orderId}
                onChange={e => { setOrderId(e.target.value.toUpperCase()); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono tracking-wider"
                placeholder="e.g. 12C927C7"
              />
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleTrack}
          disabled={loading}
          className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Tracking...</> : <><Search className="w-4 h-4" /> Track Order</>}
        </button>
      </div>

      {/* Tracking Result */}
      {order && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Order Header */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-foreground/50 font-medium uppercase tracking-wider mb-1">Order ID</p>
                <p className="text-xl font-bold font-mono text-foreground">#{order.id.split('-')[0].toUpperCase()}</p>
                <p className="text-sm text-foreground/60 mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Estimated Delivery</p>
                <p className="text-lg font-bold text-green-600">{order.status === 'Delivered' ? 'Delivered ✓' : getEstimatedDelivery()}</p>
              </div>
            </div>
          </div>

          {/* Flipkart-style Tracking Stepper */}
          <div className="p-6 sm:p-8">
            {order.status === 'Cancelled' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✕</span>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Order Cancelled</h3>
                <p className="text-foreground/60">This order has been cancelled. Refund will be processed within 5-7 business days.</p>
              </div>
            ) : (
              <div className="relative">
                {TRACKING_STEPS.map((step, idx) => {
                  const currentIdx = getCurrentStepIndex();
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isLast = idx === TRACKING_STEPS.length - 1;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex gap-4 sm:gap-6">
                      {/* Vertical line + circle */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500 ${
                          isCurrent ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' : 
                          isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                          'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {isCompleted && !isCurrent ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 min-h-[48px] transition-colors duration-500 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        )}
                      </div>
                      
                      {/* Step content */}
                      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                        <h4 className={`font-bold text-base ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-foreground/40'}`}>
                          {step.label}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                              <CircleDot className="w-3 h-3 animate-pulse" /> Current
                            </span>
                          )}
                        </h4>
                        <p className={`text-sm mt-0.5 ${isCompleted ? 'text-foreground/70' : 'text-foreground/30'}`}>{step.desc}</p>
                        {isCurrent && (
                          <p className="text-xs text-foreground/50 mt-1">
                            {new Date(order.updated_at || order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-100 p-6 sm:p-8">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Items in this order</h3>
            <div className="space-y-3">
              {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-white" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="font-bold text-foreground text-sm whitespace-nowrap">₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            {/* Price Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-foreground/60 text-sm">Total Amount</span>
              <span className="text-xl font-bold text-foreground">₹{Number(order.total_amount)?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="border-t border-gray-100 p-6 sm:p-8">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Shipping Address</h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed">
                <p className="font-medium text-foreground">{order.customer_name}</p>
                {order.shipping_address.door && <span>{order.shipping_address.door}, </span>}
                {order.shipping_address.street && <span>{order.shipping_address.street}, </span>}
                {order.shipping_address.city && <span>{order.shipping_address.city}, </span>}
                {order.shipping_address.state && <span>{order.shipping_address.state} </span>}
                {order.shipping_address.pin && <span>- {order.shipping_address.pin}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No result */}
      {searched && !order && !loading && !error && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No order found</h3>
          <p className="text-foreground/60 text-sm">Double-check your Order ID and mobile number.</p>
        </div>
      )}
    </div>
  );
}

export function Returns() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Returns & Refunds</h1>
      <div className="prose prose-p:text-foreground/70 max-w-none bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3>Our Return Policy</h3>
        <p>We accept returns within 7 days of delivery for damaged or incorrect items. Spiritual items like Rudraksha or customized pooja items are non-returnable unless defective.</p>
        <h3>How to Initiate a Return</h3>
        <p>Please contact our customer support with your Order ID and a photo of the received item.</p>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Send us a message</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Name" className="w-full border border-gray-300 rounded-md px-4 py-3" />
            <input type="email" placeholder="Email" className="w-full border border-gray-300 rounded-md px-4 py-3" />
            <textarea placeholder="Your message" rows={4} className="w-full border border-gray-300 rounded-md px-4 py-3"></textarea>
            <button onClick={() => alert('Message sent successfully!')} className="bg-primary text-white font-medium py-3 px-8 rounded-md hover:bg-primary-600">Send Message</button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-6">Reach out to us</h2>
          <p className="text-foreground/70 mb-4">We are here to help you with any queries regarding our products or your orders.</p>
          <div className="space-y-4 text-foreground/80">
            <p><strong>Email:</strong> support@swaxthika.com</p>
            <p><strong>Phone:</strong> +91 98765 43210</p>
            <p><strong>Address:</strong> 123 Temple Road, Chennai, Tamil Nadu, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-2">Question #{i} about shipping or products?</h3>
            <p className="text-foreground/70">Here is a detailed answer to the frequently asked question, providing clarity and support to the customer.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Shipping() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Shipping Policy</h1>
      <div className="prose prose-p:text-foreground/70 max-w-none bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3>Delivery Timelines</h3>
        <p>Most orders are processed and shipped within 2-3 business days. Delivery within India typically takes 5-7 business days.</p>
        <h3>Shipping Charges</h3>
        <p>We offer free shipping on all orders above ₹1000. For orders below ₹1000, a standard shipping fee of ₹150 applies.</p>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Privacy Policy</h1>
      <div className="prose prose-p:text-foreground/70 max-w-none bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <p>Your privacy is important to us. This privacy statement explains the personal data we process, how we process it, and for what purposes.</p>
        <p>We use the data we collect to provide you with rich, interactive experiences. In particular, we use data to provide our products and improve your shopping experience.</p>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Terms of Service</h1>
      <div className="prose prose-p:text-foreground/70 max-w-none bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <p>Welcome to Swaxthika. By accessing or using our website, you agree to be bound by these terms of service and all applicable laws and regulations.</p>
        <p>We reserve the right to withdraw or amend the service we provide on our website without notice.</p>
      </div>
    </div>
  );
}
