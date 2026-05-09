import { ShoppingCart, ArrowRight, Trash2, Minus, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function Cart() {
  const { user, openAuthModal } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
      setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast('error', 'Update Failed', 'Could not update cart quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCartItems(prev => prev.filter(item => item.id !== id));
      showToast('success', 'Removed', 'Item removed from cart.');
    } catch (err) {
      console.error('Error removing item:', err);
      showToast('error', 'Remove Failed', 'Could not remove item from cart.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">Your cart is waiting</h1>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto text-lg">Please sign in to view your cart items, add new products, and checkout securely.</p>
        <button 
          onClick={openAuthModal}
          className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition-colors shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-12 min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 px-4 min-h-[300px] flex flex-col items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h3>
                <p className="text-foreground/50 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/category/all" className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-lg font-bold transition-all">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-gray-100 bg-gray-50 text-sm font-medium text-foreground/70 uppercase tracking-wider">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className={`p-6 flex flex-col md:grid md:grid-cols-12 gap-4 items-center transition-opacity ${updatingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="col-span-6 flex items-center gap-4 w-full">
                        <img src={item.products.image || 'https://placehold.co/200x200/f3f4f6/9ca3af?text=No+Image'} alt={item.products.name} className="w-20 h-20 rounded-md object-cover bg-gray-100 border border-gray-100" />
                        <div className="flex-1">
                          <a href={`/product/${item.products.id}`} target="_blank" rel="noopener noreferrer" className="font-display font-medium text-foreground hover:text-primary transition-colors text-lg line-clamp-2">
                            {item.products.name}
                          </a>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 mt-2 transition-colors">
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                      
                      <div className="col-span-2 text-center font-medium text-foreground w-full md:w-auto flex justify-between md:block">
                        <span className="md:hidden text-foreground/60">Price:</span>
                        ₹{item.products.price}
                      </div>
                      
                      <div className="col-span-2 flex justify-center w-full md:w-auto">
                        <div className="flex items-center border border-gray-300 rounded-md h-10 w-28">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex-1 flex items-center justify-center text-foreground hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 flex items-center justify-center font-medium text-sm border-x border-gray-200 h-full">
                            {item.quantity}
                          </div>
                          <button 
                            onClick={() => updateQuantity(item.id, item.products.stock ? Math.min(item.quantity + 1, item.products.stock) : item.quantity + 1)}
                            className="flex-1 flex items-center justify-center text-foreground hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="col-span-2 text-right font-bold text-foreground w-full md:w-auto flex justify-between md:block">
                        <span className="md:hidden text-foreground/60">Subtotal:</span>
                        ₹{item.products.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className={`bg-gray-50 rounded-xl p-8 border border-gray-100 sticky top-28 ${cartItems.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-display font-bold text-foreground mb-6 border-b border-gray-200 pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-foreground/80">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-medium">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-foreground/80">
                <span>Shipping Estimate</span>
                <span className={`font-medium ${shipping === 0 && subtotal > 0 ? 'text-green-600' : 'text-foreground'}`}>
                  {subtotal === 0 ? '-' : (shipping === 0 ? 'Free' : `₹${shipping}`)}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-3xl font-bold text-foreground">₹{total}</span>
              </div>
              {subtotal > 0 && <p className="text-xs text-foreground/50 text-right mt-1">Includes all taxes</p>}
            </div>

            <Link 
              to="/checkout"
              className={`w-full h-14 font-medium text-lg rounded-md flex items-center justify-center gap-2 transition-all ${
                cartItems.length === 0 
                  ? 'bg-gray-300 text-white cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-600 shadow-sm hover:shadow-premium transform active:scale-95'
              }`}
              onClick={(e) => cartItems.length === 0 && e.preventDefault()}
            >
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
