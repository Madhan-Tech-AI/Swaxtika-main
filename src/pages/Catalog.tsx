import { Filter, ChevronDown, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Catalog() {
  const { slug } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');
        if (slug && slug !== 'all') {
          // Filter by category name (case-insensitive match)
          query = query.ilike('category', `%${slug.replace(/-/g, ' ')}%`);
        }
        const { data } = await query;
        if (data) setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [slug]);

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
                {['All Categories', 'Spiritual Books', 'Brass Idols', 'Pooja Items', 'Temple Jewellery', 'Homam Samagri'].map((cat, idx) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked={idx === 0} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                    <span className="text-foreground/80 group-hover:text-primary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Price Range</h3>
              <div className="space-y-3">
                {['Under ₹1,000', '₹1,000 - ₹5,000', '₹5,000 - ₹10,000', 'Over ₹10,000'].map((price) => (
                  <label key={price} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                    <span className="text-foreground/80 group-hover:text-primary transition-colors">{price}</span>
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
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
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
            <p className="text-foreground/70 mb-4 sm:mb-0">Showing 1-12 of 124 products</p>
            <div className="flex items-center gap-2">
              <span className="text-foreground/70 text-sm">Sort by:</span>
              <button className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 border border-gray-200 rounded-md bg-gray-50">
                Recommended <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center text-foreground/50">
                No products found in the database.
              </div>
            ) : products.map((product) => (
              <div key={product.id} className="group flex flex-col">
                {/* Image */}
                <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#f5f2ef] aspect-[3/4]">
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
                      onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                      className="w-full bg-foreground text-white text-xs font-bold tracking-widest uppercase py-3.5 hover:bg-primary transition-colors"
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
          <div className="flex justify-center mt-12 gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground/50 hover:bg-gray-50 transition-colors" disabled>
              Prev
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-md bg-primary text-white font-medium">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground hover:bg-gray-50 transition-colors">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground hover:bg-gray-50 transition-colors">3</button>
            <span className="w-10 h-10 flex items-center justify-center text-foreground/50">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 text-foreground hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
