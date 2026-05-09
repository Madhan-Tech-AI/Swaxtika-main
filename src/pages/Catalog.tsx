import { Filter, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Spiritual Books', 'Brass Idols', 'Pooja Items', 'Temple Jewellery', 'Homam Samagri'];
const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: 'Over ₹10,000', min: 10001, max: Infinity },
];
const ITEMS_PER_PAGE = 12;

export function Catalog() {
  const { slug } = useParams();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { requireAuth, user } = useAuth();
  const { showToast } = useToast();

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('status', 'Active')
          .order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        if (data) setAllProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Real-time subscription
    const channel = supabase
      .channel('catalog-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').eq('status', 'Active').order('created_at', { ascending: false });
        if (data) setAllProducts(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Apply URL slug as category filter on mount
  useEffect(() => {
    if (slug && slug !== 'all') {
      const matchedCat = CATEGORIES.find(c => c.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase() || c.toLowerCase().includes(slug.toLowerCase().replace(/-/g, ' ')));
      if (matchedCat) setSelectedCategories([matchedCat]);
    } else {
      setSelectedCategories([]);
    }
  }, [slug]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedCategories, selectedPriceRanges, selectedRating, sortBy]);

  // Filter and sort products
  const filteredProducts = allProducts.filter(p => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    // Price filter
    if (selectedPriceRanges.length > 0) {
      const matchesPrice = selectedPriceRanges.some(idx => p.price >= PRICE_RANGES[idx].min && p.price <= PRICE_RANGES[idx].max);
      if (!matchesPrice) return false;
    }
    // Rating filter
    if (selectedRating > 0 && (p.rating || 0) < selectedRating) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0; // recommended = default order
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const togglePriceRange = (idx: number) => {
    setSelectedPriceRanges(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <div className="text-sm text-foreground/60 mb-8">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">All Products</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6 text-xl font-display font-semibold text-foreground">
            <Filter className="w-5 h-5" />
            <h2>Filters</h2>
          </div>

          <div className="space-y-8">
            {/* Category Filter */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Categories</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={() => setSelectedCategories([])}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                  />
                  <span className={`group-hover:text-primary transition-colors ${selectedCategories.length === 0 ? 'text-primary font-medium' : 'text-foreground/80'}`}>All Categories</span>
                </label>
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <span className={`group-hover:text-primary transition-colors ${selectedCategories.includes(cat) ? 'text-primary font-medium' : 'text-foreground/80'}`}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Price Range</h3>
              <div className="space-y-3">
                {PRICE_RANGES.map((range, idx) => (
                  <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedPriceRanges.includes(idx)}
                      onChange={() => togglePriceRange(idx)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <span className={`group-hover:text-primary transition-colors ${selectedPriceRanges.includes(idx) ? 'text-primary font-medium' : 'text-foreground/80'}`}>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Customer Ratings</h3>
              <div className="space-y-3">
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedRating === rating}
                      onChange={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex items-center gap-1 text-accent">
                      {Array.from({length: 5}).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-foreground/80 text-sm ml-1">& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-8">
            <p className="text-foreground/70 mb-4 sm:mb-0">
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <span className="text-foreground/70 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="font-medium text-foreground px-3 py-1.5 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {paginatedProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-foreground/50">
                No products found matching your filters.
              </div>
            ) : paginatedProducts.map((product) => (
              <div key={product.id} className="group flex flex-col">
                {/* Image */}
                <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden bg-[#f5f2ef] aspect-[3/4]">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1629813589437-0176045d62b9?auto=format&fit=crop&q=80&w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.original_price > product.price && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white bg-foreground px-2.5 py-1">
                        -{Math.round((1 - product.price / product.original_price) * 100)}% OFF
                      </span>
                    </div>
                  )}
                  {/* Hover CTA */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                      className="w-full bg-foreground text-white text-xs font-bold tracking-widest uppercase py-3.5 hover:bg-primary transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </a>
                {/* Info */}
                <div className="pt-4 pb-2 flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">{product.category || 'Sacred'}</span>
                  <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-foreground">₹{product.price?.toLocaleString('en-IN')}</span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-foreground/35 line-through">₹{product.original_price?.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
                <div key={p} className="flex items-center gap-2">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-foreground/50">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md font-medium ${currentPage === p ? 'bg-primary text-white' : 'border border-gray-200 text-foreground hover:bg-gray-50'} transition-colors`}
                  >
                    {p}
                  </button>
                </div>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
