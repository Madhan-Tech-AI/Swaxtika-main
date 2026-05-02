import { ArrowRight, ShieldCheck, Truck, Award, Clock, Flame, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [deities, setDeities] = useState<any[]>([]);
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { requireAuth, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

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
            .insert([{
              user_id: user.id,
              product_id: product.id,
              quantity: 1
            }]);
        }
        showToast('success', 'Cart', 'Item added to cart successfully!');
      } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('error', 'Cart Error', 'Failed to add item to cart.');
      }
    });
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [catRes, prodRes, deitRes, carouselRes] = await Promise.all([
          supabase.from('categories').select('*').limit(5),
          supabase.from('products').select('*').eq('is_featured', true).limit(4),
          supabase.from('deities').select('*').limit(6),
          supabase.from('carousel_items').select('*').eq('is_active', true).order('order_index', { ascending: true })
        ]);
        
        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data) setFeaturedProducts(prodRes.data);
        if (deitRes.data) setDeities(deitRes.data);
        if (carouselRes.data) setCarouselItems(carouselRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        {carouselItems.length > 0 ? (
          carouselItems.map((slide, index) => {
            const isCurrent = index === currentSlide;
            return (
              <Link 
                key={slide.id} 
                to={slide.link_url || '#'}
                className={`absolute inset-0 block transition-opacity duration-1000 ease-in-out ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                {/* Background Image with Zoom Effect */}
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <img 
                    src={slide.image_url} 
                    alt={`Hero Slide ${index + 1}`} 
                    className={`w-full h-full object-cover transition-transform duration-[15000ms] ease-out ${isCurrent ? 'scale-105' : 'scale-100'}`}
                  />
                  {/* Stronger vignette for premium feel and text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80"></div>
                </div>

                {/* Premium Badge Overlay */}
                {slide.badge && (
                  <div className="absolute top-12 md:top-16 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex justify-center pointer-events-none">
                    <div className={`inline-flex items-center justify-center gap-4 px-8 py-3 rounded-full backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl transition-all duration-1000 ${isCurrent ? 'translate-y-0 opacity-100 delay-500' : '-translate-y-4 opacity-0'}
                      ${slide.badge === 'Hot Deals' ? 'text-orange-400' : 
                        slide.badge === 'Today\'s Deals' ? 'text-red-400' : 
                        'text-white'}`}>
                      <div className="h-px w-8 md:w-16 bg-current opacity-50 shadow-[0_0_8px_currentColor]"></div>
                      <div className="flex items-center gap-3">
                        {slide.badge === 'Hot Deals' && <Flame className="w-5 h-5 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                        {slide.badge === 'Today\'s Deals' && <Clock className="w-5 h-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                        {slide.badge === 'Top Deals' && <Zap className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                        <span className="text-sm md:text-base font-bold uppercase tracking-[0.4em] drop-shadow-2xl text-white">
                          {slide.badge}
                        </span>
                      </div>
                      <div className="h-px w-8 md:w-16 bg-current opacity-50 shadow-[0_0_8px_currentColor]"></div>
                    </div>
                  </div>
                )}
              </Link>
            );
          })
        ) : (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-900">
            <div className="text-white/50">No slides configured. Please add slides in the admin dashboard.</div>
          </div>
        )}

        {/* Carousel Indicators (More Premium) */}
        {carouselItems.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`group relative h-1 transition-all duration-500 ${index === currentSlide ? 'w-16 bg-primary' : 'w-8 bg-white/20 hover:bg-white/40'}`}
              >
                <span className="absolute -top-4 left-0 text-[10px] font-bold text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  0{index + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Rest of the sections... (I'll keep them as they are but ensure they flow well) */}
      
      {/* Category Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">Our Collections</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Sacred Categories</h2>
            </div>
            <Link to="/category/all" className="hidden md:flex items-center gap-2 text-primary font-bold hover:text-primary-600 transition-colors group">
              View All Collections <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.name.toLowerCase().replace(' ', '-')}`} className="group block">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white font-display font-bold text-2xl mb-1">{category.name}</h3>
                    <div className="w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-500"></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">Handpicked for you</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Featured Products</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group flex flex-col">
                {/* Image */}
                <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#f5f2ef] aspect-[3/4]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.original_price > product.price && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white bg-foreground px-2.5 py-1">
                        {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                      </span>
                    </div>
                  )}
                  {/* Hover CTA */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                      className="w-full bg-foreground text-white text-xs font-bold tracking-widest uppercase py-3 hover:bg-primary transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </Link>
                {/* Info */}
                <div className="pt-4 pb-2 flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">{product.category || 'Sacred'}</span>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-foreground/35 line-through">₹{product.original_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative rounded-[40px] overflow-hidden bg-primary h-[500px] flex items-center group shadow-3xl shadow-primary/20">
            <div className="absolute right-0 top-0 bottom-0 w-3/5 hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=1200" 
                alt="Incense and meditation" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[10000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/40 to-primary"></div>
            </div>
            <div className="relative z-10 p-12 md:p-24 max-w-2xl text-white">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-8">Limited Edition</span>
              <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">Create Your <br/> Sacred Space</h2>
              <p className="text-white/80 text-xl mb-12 leading-relaxed max-w-lg">
                Discover our new collection of brass idols and pure essential oils perfect for daily meditation and pooja.
              </p>
              <Link to="/category/pooja" className="bg-white text-primary px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl active:scale-95 inline-block">
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
