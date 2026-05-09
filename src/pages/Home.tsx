import { ArrowRight, Clock, Flame, Zap, Star, Quote, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<Record<string, any>>({});
  const [, setDeities] = useState<any[]>([]);
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { requireAuth, user } = useAuth();
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
        const [catRes, prodRes, deitRes, carouselRes, bannerRes] = await Promise.all([
          supabase.from('categories').select('*').limit(10),
          supabase.from('products').select('*').eq('status', 'Active').limit(24),
          supabase.from('deities').select('*').limit(6),
          supabase.from('carousel_items').select('*').eq('is_active', true).order('order_index', { ascending: true }),
          supabase.from('featured_banners').select('*').eq('is_active', true)
        ]);
        
        if (bannerRes.data) {
          const bannerMap = bannerRes.data.reduce((acc: any, b: any) => ({ ...acc, [b.slot_name]: b }), {});
          setBanners(bannerMap);
        }
        
        let fetchedCategories = catRes.data || [];
        
        // Add premium mock categories for variety and user requirement
        const mockCategories = [
          { id: 'm1', name: 'Savitri Pooja', image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&q=80&w=400' },
          { id: 'm2', name: 'Pooja Samagri', image: 'https://images.unsplash.com/photo-1609137144813-90928e367878?auto=format&fit=crop&q=80&w=400' },
          { id: 'm3', name: 'Idols & Handicrafts', image: 'https://images.unsplash.com/photo-1582234372130-97cc181056cb?auto=format&fit=crop&q=80&w=400' },
          { id: 'm4', name: 'Spiritual Books', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
          { id: 'm5', name: 'Temple Jewelry', image: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=400' },
          { id: 'm6', name: 'Homam Items', image: 'https://images.unsplash.com/photo-1561149775-690a986f3458?auto=format&fit=crop&q=80&w=400' },
          { id: 'm7', name: 'Yantram Collections', image: 'https://images.unsplash.com/photo-1596751303335-ca42b3ca50c1?auto=format&fit=crop&q=80&w=400' },
          { id: 'm8', name: 'Puja Lamps', image: 'https://images.unsplash.com/photo-1621644799015-842245b0840c?auto=format&fit=crop&q=80&w=400' }
        ];

        // Merge and ensure uniqueness by name
        const finalCategories = [...fetchedCategories];
        mockCategories.forEach(mock => {
          if (!finalCategories.find(c => c.name.toLowerCase().trim() === mock.name.toLowerCase().trim())) {
            finalCategories.push(mock);
          }
        });

        setCategories(finalCategories);
        
        if (prodRes.data) {
          // Randomly shuffle products
          const shuffled = [...prodRes.data].sort(() => Math.random() - 0.5);
          setFeaturedProducts(shuffled.slice(0, 12));
        }
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
      
      {/* Category Section - Premium Circular UI */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2 block">Sacred Collections</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Explore Categories</h2>
            </div>
            <Link to="/category/all" className="flex items-center gap-2 text-primary font-bold text-sm hover:translate-x-1 transition-transform">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-8 md:gap-12 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`} 
                className="flex flex-col items-center gap-4 group min-w-[120px] md:min-w-[140px] snap-center"
              >
                <div className="relative w-28 h-28 md:w-36 md:h-36">
                  {/* Decorative Outer Rings */}
                  <div className="absolute inset-[-4px] rounded-full border border-primary/10 group-hover:border-primary/40 transition-colors duration-500"></div>
                  <div className="absolute inset-[-8px] rounded-full border border-primary/5 group-hover:border-primary/20 transition-colors duration-700 delay-100"></div>
                  
                  {/* Main Image Container */}
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-xl group-hover:shadow-primary/20 transition-all duration-500 transform group-hover:scale-105">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Golden Overlay on Hover */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
                
                <h3 className="text-sm md:text-base font-bold text-foreground text-center group-hover:text-primary transition-colors tracking-wide">
                  {category.name}
                </h3>
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

          <div className="relative group/carousel">
            <div 
              id="featured-carousel"
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8"
              style={{ scrollBehavior: 'smooth' }}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="min-w-[240px] md:min-w-[260px] snap-start group flex flex-col">
                  {/* Image */}
                  <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden bg-[#f5f2ef] aspect-square rounded-2xl">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.original_price > product.price && (
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white bg-foreground px-2.5 py-1 rounded-md">
                          {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    {/* Hover CTA */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-4">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                        className="w-full bg-white/90 backdrop-blur-md text-foreground text-xs font-bold tracking-widest uppercase py-4 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </a>
                  {/* Info */}
                  <div className="pt-5 pb-2 flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60">{product.category || 'Sacred'}</span>
                    <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                      <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors h-12">
                        {product.name}
                      </h3>
                    </a>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.original_price > product.price && (
                        <span className="text-sm text-foreground/35 line-through">₹{product.original_price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button 
              onClick={() => { document.getElementById('featured-carousel')?.scrollBy({ left: -400, behavior: 'smooth' }); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
            </button>
            <button 
              onClick={() => { document.getElementById('featured-carousel')?.scrollBy({ left: 400, behavior: 'smooth' }); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Promotional Banner (CTA) - Fixed Hover */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative rounded-[40px] overflow-hidden bg-[#f97316] h-[450px] flex items-center shadow-2xl shadow-orange-900/10 border border-orange-100">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=1200" 
                alt="Incense and meditation" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#f97316]"></div>
            </div>
            <div className="relative z-10 p-12 md:p-20 max-w-2xl text-white">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Limited Edition</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">Create Your <br/> Sacred Space</h2>
              <p className="text-white/90 text-lg mb-10 leading-relaxed max-w-lg">
                Discover our new collection of brass idols and pure essential oils perfect for daily meditation and pooja.
              </p>
              <Link to="/category/pooja" className="bg-white text-[#f97316] px-10 py-4 rounded-2xl font-bold text-base hover:shadow-2xl transition-all active:scale-95 inline-block">
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Grid (Admin Controlled) */}
      {Object.keys(banners).length > 0 && (
        <section className="py-24 bg-[#fbfaf8] relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Large Left Card - Main Featured */}
              {banners['main_featured_large']?.image_url && (
                <div className="lg:w-2/3">
                  <Link 
                    to={banners['main_featured_large'].link_url || '#'} 
                    className="block relative group overflow-hidden rounded-[40px] bg-white shadow-sm hover:shadow-2xl transition-all duration-700 aspect-[8/7] md:aspect-auto md:h-[700px]"
                  >
                    <img 
                      src={banners['main_featured_large'].image_url} 
                      alt={banners['main_featured_large'].title || 'Featured'} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                </div>
              )}

              {/* Right Column Grid */}
              <div className="lg:w-1/3 flex flex-col gap-8">
                {['side_top', 'side_middle', 'side_bottom'].map((slot) => (
                  banners[slot]?.image_url ? (
                    <div key={slot} className="flex-1">
                      <Link 
                        to={banners[slot].link_url || '#'} 
                        className="block relative group overflow-hidden rounded-[32px] bg-white shadow-sm hover:shadow-xl transition-all duration-500 aspect-[2/1] lg:aspect-auto lg:h-[calc((700px-64px)/3)]"
                      >
                        <img 
                          src={banners[slot].image_url} 
                          alt={banners[slot].title || 'Side Banner'} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      </Link>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
            
            {/* Wide Bottom Card */}
            {banners['wide_bottom']?.image_url && (
              <div className="mt-8">
                <Link 
                  to={banners['wide_bottom'].link_url || '#'} 
                  className="block relative group overflow-hidden rounded-[40px] bg-white shadow-sm hover:shadow-2xl transition-all duration-700 aspect-[3/1] md:aspect-auto md:h-[350px]"
                >
                  <img 
                    src={banners['wide_bottom'].image_url} 
                    alt={banners['wide_bottom'].title || 'Wide Banner'} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Sacred Experiences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Anjali Sharma", city: "Mumbai", text: "The Brass Ganesha idol I ordered is absolutely stunning. The craftsmanship is divine and it has brought so much peace to my home temple.", rating: 5 },
              { name: "Rajesh Iyer", city: "Chennai", text: "Exceptional quality of pooja samagri. The delivery was fast and the items were packed with great care. Swaxtika is now my go-to for all rituals.", rating: 5 },
              { name: "Priya Menon", city: "Bangalore", text: "I've been looking for authentic spiritual books for a long time. The collection here is curated perfectly for someone on a spiritual path.", rating: 5 }
            ].map((review, i) => (
              <div key={i} className="bg-[#fbfaf8] p-10 rounded-[32px] border border-gray-100 relative group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/70 italic leading-relaxed mb-8 text-lg">"{review.text}"</p>
                <div>
                  <h4 className="font-bold text-foreground">{review.name}</h4>
                  <p className="text-xs text-primary font-medium tracking-widest uppercase mt-1">{review.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#fbfaf8]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Help Center</span>
            <h2 className="text-4xl font-display font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "How do you ensure the authenticity of the idols?", a: "Every idol at Swaxtika is handcrafted by master artisans in traditional centers like Kumbakonam and Jaipur. We use high-grade brass, bronze, and copper, following traditional Agamic proportions." },
              { q: "Do you offer international shipping?", a: "Yes, we ship our sacred collections worldwide. Delivery times vary by location, typically ranging from 7-14 business days for international orders." },
              { q: "Can I get personalized pooja samagri kits?", a: "Absolutely. We offer customized kits for specific rituals like Grahapravesam, Sathyanarayana Pooja, etc. Contact our support team for a personalized consultation." },
              { q: "What is your return policy for sacred items?", a: "We take great care in packaging. If an item arrives damaged, we offer a full replacement or refund. For other returns, please refer to our detailed Return Policy page." }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h4 className="font-bold text-foreground pr-8">{faq.q}</h4>
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <Plus className="absolute inset-0 w-6 h-6 text-primary group-open:opacity-0 transition-opacity" />
                    <Minus className="absolute inset-0 w-6 h-6 text-primary opacity-0 group-open:opacity-100 transition-opacity" />
                  </div>
                </summary>
                <div className="px-6 pb-6 text-foreground/70 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

