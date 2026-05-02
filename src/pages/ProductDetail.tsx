import { Star, ShieldCheck, Truck, RotateCcw, Share2, Loader2, ChevronRight, Lock, MapPin, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

const REVIEWS = [
  { name: 'Priya S.', stars: 5, date: '3 April 2026', comment: 'Absolutely stunning. The craftsmanship is exceptional — it arrived beautifully packed and felt truly sacred.' },
  { name: 'Rajan M.', stars: 4, date: '29 September 2025', comment: 'Very authentic quality. Delivery was prompt and the item was exactly as described. Highly recommend.' },
  { name: 'Sunita K.', stars: 5, date: '17 February 2026', comment: 'I purchased this for our home puja room and it looks magnificent. Worth every rupee.' },
  { name: 'Arjun V.', stars: 5, date: '21 January 2026', comment: 'The detail work is breathtaking. You can feel the devotion that went into making this.' },
];

function StarRow({ count, filled }: { count: number; filled: boolean }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${filled ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [wishlisted, setWishlisted] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);

  const { requireAuth, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProduct(data);
        setActiveImage(data.image);
        const { data: rel } = await supabase.from('products').select('*').eq('category', data.category).neq('id', id).limit(4);
        if (rel) setRelated(rel);
        const { data: bns } = await supabase.from('banners').select('*');
        if (bns) setBanners(bns);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleAddToCart = () => {
    requireAuth(async () => {
      if (!user || !product) return;
      setIsAdding(true);
      try {
        const { data: ex } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', product.id).single();
        if (ex) {
          await supabase.from('cart_items').update({ quantity: ex.quantity + quantity }).eq('id', ex.id);
        } else {
          await supabase.from('cart_items').insert([{ user_id: user.id, product_id: product.id, quantity }]);
        }
        showToast('success', 'Added to Cart', `${product.name} × ${quantity}`);
        navigate('/cart');
      } catch {
        showToast('error', 'Error', 'Failed to add to cart.');
      } finally { setIsAdding(false); }
    });
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: product?.name, url: window.location.href }); } catch {} }
    else { navigator.clipboard.writeText(window.location.href); showToast('success', 'Link Copied', 'Copied to clipboard!'); }
  };

  const handlePincodeCheck = () => {
    if (!pincode || pincode.length < 5) { setPincodeMsg('Enter valid pincode.'); return; }
    setPincodeMsg('');
    setTimeout(() => { setPincodeMsg(`✓ Delivery by ${new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}`); }, 700);
  };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-display font-bold text-foreground">Product Not Found</h1>
      <Link to="/category/all" className="text-primary font-medium underline">Back to Catalog</Link>
    </div>
  );

  const allImages = [product.image, ...(product.additional_images || [])].filter(Boolean);
  const bulletPoints = product.bullet_points ? (Array.isArray(product.bullet_points) ? product.bullet_points : product.bullet_points.split('|')) : [];
  const discount = product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  const deliveryDate = new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white min-h-screen pb-20">

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-xs text-foreground/50">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/category/all" className="hover:text-primary transition-colors">Catalog</Link>
          <ChevronRight className="w-3 h-3" />
          {product.category && <><Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-primary transition-colors">{product.category}</Link><ChevronRight className="w-3 h-3" /></>}
          <span className="text-foreground/80 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Top Section: 3-Column Amazon Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ── Column 1: Image Gallery ── */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 h-fit">
            {/* Thumbnails (Left) */}
            {allImages.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-16 flex-shrink-0 hide-scrollbar pb-2 sm:pb-0">
                {allImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden bg-[#f5f2ef] rounded-md transition-all duration-200 border-2 ${activeImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main Image */}
            <div className="flex-1 relative bg-[#f5f2ef] rounded-xl overflow-hidden group">
              <img src={activeImage} alt={product.name} className="w-full h-auto object-cover cursor-crosshair" />
              <button onClick={handleShare} className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                <Share2 className="w-4 h-4 text-foreground/70" />
              </button>
            </div>
          </div>

          {/* ── Column 2: Product Core Info ── */}
          <div className="lg:col-span-4 flex flex-col">
            <Link to={`/category/${product.category?.toLowerCase() || 'all'}`} className="text-primary text-sm font-semibold hover:underline mb-1">
              Visit the Swaxtika Store
            </Link>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-snug mb-3">{product.name}</h1>
            
            {/* Ratings */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm">4.8</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}
                </div>
              </div>
              <span className="text-sm text-primary hover:underline cursor-pointer">{REVIEWS.length} ratings</span>
            </div>

            {/* Price Block */}
            <div className="mb-6">
              {discount > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm">-{discount}%</span>
                  <span className="text-red-600 font-medium text-sm">Limited time deal</span>
                </div>
              )}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium relative top-[-0.5rem]">₹</span>
                <span className="text-4xl font-bold text-foreground">{product.price?.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="text-sm text-foreground/50">
                  M.R.P.: <span className="line-through">₹{product.original_price?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <p className="text-sm font-medium mt-1 text-foreground/80">Inclusive of all taxes</p>
            </div>

            {/* Offers/Perks row */}
            <div className="flex items-center gap-6 py-4 border-y border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
              <div className="flex flex-col items-center gap-2 min-w-[70px] text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-primary"><RotateCcw className="w-5 h-5" /></div>
                <span className="text-[10px] text-primary hover:underline cursor-pointer leading-tight">7 Days<br/>Returnable</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[70px] text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-primary"><Truck className="w-5 h-5" /></div>
                <span className="text-[10px] text-primary hover:underline cursor-pointer leading-tight">Free<br/>Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[70px] text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-primary"><ShieldCheck className="w-5 h-5" /></div>
                <span className="text-[10px] text-primary hover:underline cursor-pointer leading-tight">Top Brand<br/>Quality</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[70px] text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-primary"><Lock className="w-5 h-5" /></div>
                <span className="text-[10px] text-primary hover:underline cursor-pointer leading-tight">Secure<br/>Transaction</span>
              </div>
            </div>

            {/* Specs Mini Table */}
            <div className="mb-6 space-y-2">
              <div className="flex text-sm"><span className="w-32 font-bold text-foreground">Brand</span><span className="text-foreground/80">Swaxtika</span></div>
              <div className="flex text-sm"><span className="w-32 font-bold text-foreground">Material</span><span className="text-foreground/80">Premium Quality</span></div>
              {product.category && <div className="flex text-sm"><span className="w-32 font-bold text-foreground">Category</span><span className="text-foreground/80">{product.category}</span></div>}
            </div>

            {/* About this item */}
            {bulletPoints.length > 0 && (
              <div>
                <h3 className="font-bold text-base mb-3">About this item</h3>
                <ul className="space-y-2">
                  {bulletPoints.map((bp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-primary font-bold mt-[-2px]">•</span>
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Column 3: The Buy Box ── */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-xl p-5 sticky top-24 bg-white shadow-sm">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-sm font-medium relative top-[-0.3rem]">₹</span>
                <span className="text-2xl font-bold">{product.price?.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="mb-4">
                <span className="text-primary font-bold text-sm">FREE delivery</span> <span className="font-bold text-sm">{deliveryDate}</span>. <a href="#" className="text-primary text-sm hover:underline">Details</a>
              </div>
              
              {/* Delivery location */}
              <div className="flex items-start gap-2 mb-4 text-sm">
                <MapPin className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-primary hover:underline cursor-pointer leading-tight">
                    {pincodeMsg && pincodeMsg.startsWith('✓') ? pincodeMsg.replace('✓ ', '') : 'Select delivery location'}
                  </div>
                  {!pincodeMsg?.startsWith('✓') && (
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1 text-xs" />
                      <button onClick={handlePincodeCheck} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-medium transition-colors">Apply</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock */}
              <h4 className={`text-lg font-medium mb-4 ${(product.stock || 0) > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {(product.stock || 0) > 10 ? 'In stock' : (product.stock || 0) > 0 ? `Only ${product.stock} left in stock` : 'Out of stock'}
              </h4>

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-medium">Quantity:</span>
                <select 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-gray-50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {[...Array(Math.min(10, product.stock || 1))].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || (product.stock !== null && product.stock <= 0)}
                  className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-foreground font-medium py-2.5 rounded-full shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Cart'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || (product.stock !== null && product.stock <= 0)}
                  className="w-full bg-[#ffa41c] hover:bg-[#fa8900] text-foreground font-medium py-2.5 rounded-full shadow-sm transition-colors text-sm"
                >
                  Buy Now
                </button>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer mb-6">
                <Lock className="w-4 h-4 text-foreground" />
                <span>Secure transaction</span>
              </div>

              <div className="text-xs space-y-1 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between"><span className="text-foreground/60">Ships from</span><span className="font-medium text-foreground text-right">Swaxtika Authentic</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Sold by</span><span className="font-medium text-foreground text-right">Swaxtika</span></div>
              </div>

              <button 
                onClick={() => { setWishlisted(!wishlisted); requireAuth(() => showToast('success', wishlisted ? 'Removed' : 'Wishlisted', product.name)); }}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Add to Wish List
              </button>
            </div>
          </div>
        </div>

        <hr className="my-12 border-gray-200" />

        {/* ── Middle Section: Rich Description ── */}
        <div className="max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">Product Description</h2>
          
          {/* Simulated A+ Content Banner */}
          <div className="w-full rounded-2xl overflow-hidden mb-8 bg-[#f5f2ef] border border-gray-100 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            <div className="flex-1 space-y-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Premium Collection</span>
              <h3 className="text-3xl font-display font-bold text-foreground leading-tight">Elevate Your Spiritual Space</h3>
              <p className="text-foreground/70 leading-relaxed text-sm md:text-base">
                {product.description || "Every piece is crafted with utmost devotion and precision, ensuring that the sanctity of your rituals is maintained. We source only the finest materials to bring you authentic spiritual artifacts."}
              </p>
            </div>
            <div className="w-full md:w-1/2 aspect-video bg-white rounded-xl overflow-hidden shadow-lg border border-white">
              <img src={activeImage} alt="Lifestyle" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>

          <p className="text-foreground/80 leading-relaxed text-sm">
            {product.description}
          </p>
        </div>

        <hr className="my-12 border-gray-200" />

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="space-y-16">
            
            {/* Top Deals / Banners Section */}
            {banners.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Top Deals <span className="text-sm font-normal text-foreground/50 ml-2">Sponsored</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.map((b) => (
                    <a key={b.id} href={b.link_url} className="block group rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Ad</div>
                      <img src={b.image_url} alt="Banner" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Frequently Bought Together */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Frequently bought together</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {related.map((p) => (
                  <div key={p.id + 'fbt'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related products with free delivery on eligible orders */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Related products with free delivery on eligible orders</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...related].reverse().map((p) => (
                  <div key={p.id + 'freedel'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsored */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Sponsored <span className="text-xs font-normal text-foreground/50 ml-2 cursor-pointer hover:underline">Leave ad feedback</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {related.map((p) => (
                  <div key={p.id + 'spons'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured items you may like */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Featured items you may like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...related].reverse().map((p) => (
                  <div key={p.id + 'feat'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customers frequently viewed */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Customers frequently viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {related.map((p) => (
                  <div key={p.id + 'viewed'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular products in the last 7 days */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Sponsored | Popular products in the last 7 days</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...related].reverse().map((p) => (
                  <div key={p.id + 'pop7'} className="group flex flex-col">
                    <Link to={`/product/${p.id}`} className="block relative bg-[#f5f2ef] rounded-lg overflow-hidden aspect-square mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                    <Link to={`/product/${p.id}`}><h3 className="text-xs text-primary font-medium line-clamp-2 hover:underline leading-snug mb-1">{p.name}</h3></Link>
                    <div className="flex items-baseline gap-1"><span className="text-xs">₹</span><span className="text-base font-bold">{p.price?.toLocaleString('en-IN')}</span></div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        <hr className="my-12 border-gray-200" />

        {/* ── Bottom Section: Reviews ── */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Customer reviews</h2>
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Review Summary (Left Column) */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-6 h-6 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}
                </div>
                <span className="text-lg font-bold">4.8 out of 5</span>
              </div>
              <p className="text-sm text-foreground/60 mb-6">{REVIEWS.length} global ratings</p>
              
              <div className="space-y-3 mb-8">
                {[5,4,3,2,1].map(stars => {
                  const count = REVIEWS.filter(r => r.stars === stars).length;
                  const pct = Math.round((count / REVIEWS.length) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm text-primary hover:underline cursor-pointer">
                      <span className="w-10 text-right">{stars} star</span>
                      <div className="flex-1 h-5 bg-gray-100 border border-gray-300 rounded overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-bold text-lg mb-2">Review this product</h3>
              <p className="text-sm text-foreground/70 mb-4">Share your thoughts with other customers</p>
              <button className="w-full py-2 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Write a product review
              </button>
            </div>

            {/* Individual Reviews (Right Column) */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-6">Top reviews from India</h3>
              <div className="space-y-8">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="border-b border-gray-200 pb-8 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">{r.name[0]}</span>
                      </div>
                      <span className="font-medium text-sm">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRow count={r.stars} filled={true} />
                      <span className="text-sm font-bold">{r.stars >= 4 ? 'Excellent quality and packaging' : 'Good product'}</span>
                    </div>
                    <p className="text-xs text-foreground/50 mb-3">Reviewed in India on {r.date}</p>
                    <p className="text-xs font-bold text-orange-600 mb-2">Verified Purchase</p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">{r.comment}</p>
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <button className="px-6 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Helpful</button>
                      <span className="border-l border-gray-300 pl-4 hover:underline cursor-pointer">Report</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <hr className="my-12 border-gray-200" />

        {/* ── CTA: Become a Seller ── */}
        <div className="bg-amber-50 rounded-2xl p-8 md:p-12 text-center border border-amber-100 max-w-4xl mx-auto">
          <Store className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-amber-900 mb-4">Start Selling on Sacred Shoppe</h2>
          <p className="text-amber-800/80 mb-8 max-w-2xl mx-auto">
            Reach thousands of customers looking for authentic spiritual and religious products. Join our community of trusted sellers today.
          </p>
          <button 
            onClick={() => navigate('/joinform')}
            className="px-8 py-4 bg-amber-900 text-white rounded-full font-bold hover:bg-amber-950 transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
            Become a Seller <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
