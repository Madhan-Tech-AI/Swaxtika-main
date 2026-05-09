import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Store, Phone, MapPin, ExternalLink, ArrowRight, ShoppingCart, Star, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function SellerStore() {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { requireAuth, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!sellerId) return;
      setLoading(true);
      try {
        // Fetch seller details
        const { data: sData } = await supabase
          .from('seller_applications')
          .select('*')
          .eq('id', sellerId)
          .single();

        if (sData) setSeller(sData);

        // Fetch seller products
        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', sellerId)
          .eq('status', 'Active')
          .order('created_at', { ascending: false });

        if (pData) setProducts(pData);
      } catch (err) {
        console.error('Error fetching store data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [sellerId]);

  const handleAddToCart = async (product: any) => {
    requireAuth(async () => {
      if (!user) return;
      try {
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .single();

        if (existingItem) {
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + 1 })
            .eq('id', existingItem.id);
        } else {
          await supabase
            .from('cart_items')
            .insert([{ user_id: user.id, product_id: product.id, quantity: 1 }]);
        }
        showToast('success', 'Cart', 'Item added to cart successfully!');
      } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Cart Error', 'Failed to add item to cart.');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Store className="w-16 h-16 text-gray-200 mb-4" />
        <h1 className="text-3xl font-display font-bold text-foreground">Store Not Found</h1>
        <p className="text-foreground/60 mb-8 max-w-md">The store you're looking for doesn't exist or is currently unavailable.</p>
        <Link to="/" className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Store Hero Header */}
      <div className="relative h-[400px] overflow-hidden bg-primary-900">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-10"></div>
        <img 
          src={seller.store_banner || "https://images.unsplash.com/photo-1528698853707-bc150acc65d8?auto=format&fit=crop&q=80&w=2000"} 
          alt="Store Background" 
          className="w-full h-full object-cover blur-[2px] scale-105"
        />
        
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-[40px] shadow-2xl flex items-center justify-center border-4 border-white/20 overflow-hidden">
                {seller.store_logo ? (
                  <img src={seller.store_logo} alt={seller.business_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl font-display font-bold text-primary">
                    {seller.business_name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left text-white pb-4">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                    Official Partner
                  </span>
                  <div className="flex items-center gap-1 text-accent">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">4.9 Store Rating</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight">{seller.business_name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/70">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary-200" /> {seller.city}, {seller.state}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4 text-primary-200" /> {seller.phone}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-4">
                <a 
                  href={seller.store_website || `https://www.google.com/search?q=${encodeURIComponent(seller.business_name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-foreground px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Contact Us <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <nav className="flex items-center gap-8">
              <button className="text-sm font-bold text-primary border-b-2 border-primary h-16 flex items-center">
                All Products
              </button>
              <a href="#about" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors h-16 flex items-center">
                About Store
              </a>
              <button className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors h-16 flex items-center">
                Reviews
              </button>
            </nav>
            <div className="hidden md:flex items-center gap-4 text-sm text-foreground/40 font-medium">
              <span>{products.length} Products</span>
              <span className="opacity-30">|</span>
              <span>Member since 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      {seller.store_description && (
        <section id="about" className="bg-white border-b border-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-display font-bold text-foreground">About Our Brand</h2>
              </div>
              <p className="text-lg text-foreground/70 leading-relaxed font-sans whitespace-pre-wrap">
                {seller.store_description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Product Feed */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground">Featured from {seller.business_name}</h2>
          <div className="flex items-center gap-4">
            <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Newest Arrivals</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
            <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-foreground/50">No products available in this store yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="block relative aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                      className="w-full bg-white text-foreground py-3 rounded-xl font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl"
                    >
                      Quick Add
                    </button>
                  </div>
                </a>
                <div className="p-6">
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60">{product.category}</span>
                    <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                      <h3 className="text-base font-bold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors h-10">
                        {product.name}
                      </h3>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.original_price > product.price && (
                        <span className="text-[10px] text-foreground/30 line-through">₹{product.original_price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <button className="p-2 bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-white transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
