import { Search, ShoppingCart, User, Menu, Heart, ChevronDown, MapPin, Phone, Crosshair, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function Navbar() {
  const { user, profile, signOut, openAuthModal, requireAuth } = useAuth();
  const [location, setLocation] = useState('Select location');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [cartCount, setCartCount] = useState(0);

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocation(savedLocation);
    }
  }, []);

  // Fetch and subscribe to real-time cart count
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      try {
        const { count, error } = await supabase
          .from('cart_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!error && count !== null) {
          setCartCount(count);
        }
      } catch (err) {
        console.error('Error fetching cart count:', err);
      }
    };

    fetchCartCount();

    const subscription = supabase
      .channel('cart_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` }, fetchCartCount)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim for free reverse geocoding with maximum building-level precision (zoom=18)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          
          if (data.address) {
            setManualAddress({
              doorNo: data.address.house_number || '',
              street: data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || '',
              city: data.address.city || data.address.town || data.address.village || data.address.county || '',
              state: data.address.state || '',
              pincode: data.address.postcode || ''
            });
            // We do not close the modal here automatically.
            // This allows the user to review the fetched fields and add missing ones like 'Door No' manually.
          } else {
            alert("Could not determine detailed address from coordinates.");
          }
        } catch (error) {
          console.error("Error fetching location info:", error);
          alert("Could not determine your location from coordinates.");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        let errorMsg = 'An unknown error occurred.';
        if (error.code === 1) errorMsg = 'Permission denied. Please allow location access in your device settings. (Note: Browsers block GPS if testing via HTTP IP address instead of HTTPS/localhost).';
        if (error.code === 2) errorMsg = 'Position unavailable.';
        if (error.code === 3) errorMsg = 'Request timeout.';
        alert(`Error: ${errorMsg}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyManualAddress = () => {
    const { doorNo, street, city, state, pincode } = manualAddress;
    if (city.trim() && pincode.trim()) {
      const parts = [doorNo, street, city, state, pincode].filter(Boolean).map(p => p.trim());
      const fullAddress = parts.join(', ');
      setLocation(fullAddress);
      localStorage.setItem('userLocation', fullAddress);
      setIsLocationModalOpen(false);
      setManualAddress({ doorNo: '', street: '', city: '', state: '', pincode: '' });
    } else {
      alert("Please enter at least City and Pincode");
    }
  };
  return (
    <header className="w-full flex flex-col font-sans">
      {/* Top Utility Bar */}
      <div className="bg-primary-900 text-primary-100 text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 98765 43210</span>
            <span className="opacity-50">|</span>
            <span>Customer Care</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/track-order" className="hover:text-white transition-colors">Track Your Order</Link>
            <span className="opacity-50">|</span>
            <Link to="/returns" className="hover:text-white transition-colors">Returns</Link>
            <span className="opacity-50">|</span>
            <span className="text-white font-medium">Free Shipping on orders over ₹1000</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 py-3 lg:py-4">
        <div className="container mx-auto px-4 flex flex-col gap-3">
          
          {/* Top Row: Logo, Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1 text-foreground -ml-2">
                <Menu className="w-6 h-6" />
              </button>
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary text-white rounded-full flex items-center justify-center font-display font-bold text-lg lg:text-xl">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xl lg:text-2xl tracking-tight text-foreground leading-none">
                    Sacred<span className="text-primary">.</span>
                  </span>
                  <span className="text-[8px] lg:text-[10px] text-foreground/50 tracking-widest uppercase font-medium mt-1">
                    Spiritual Store
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Location (Desktop), Search (Desktop), Actions */}
            <div className="flex items-center justify-end flex-1 gap-4 lg:gap-8">
              {/* Location Pin (Desktop) */}
              <div 
                className="hidden lg:flex items-center gap-1 text-foreground hover:text-primary transition-colors cursor-pointer flex-shrink-0"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="w-5 h-5 text-foreground/60" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-foreground/50 leading-none">Deliver to</span>
                  <span className="text-sm font-bold leading-none mt-1 truncate max-w-[120px]">{location}</span>
                </div>
              </div>

              {/* Search Bar (Desktop) */}
              <div className="hidden lg:flex flex-1 max-w-2xl items-center">
                <div className="flex w-full border-2 border-primary/20 rounded-md overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <div className="hidden xl:flex items-center px-3 bg-gray-50 border-r border-primary/20 text-sm text-foreground/70 cursor-pointer hover:bg-gray-100 transition-colors">
                    All <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search for pooja items, books, idols..." 
                    className="flex-1 px-4 py-2 outline-none text-sm text-foreground"
                  />
                  <button className="bg-primary hover:bg-primary-600 transition-colors text-white px-6 py-2 flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0 relative">
                {/* Account */}
                {user ? (
                  <div className="relative group cursor-pointer">
                    <div className="flex items-center gap-2 hover:text-primary transition-colors">
                      <User className="w-6 h-6 lg:w-6 lg:h-6 text-primary" />
                      <div className="hidden sm:flex flex-col">
                        <span className="text-[10px] text-foreground/50 leading-none">Hello, {profile?.first_name || 'User'}</span>
                        <span className="text-sm font-bold leading-none mt-1 flex items-center">
                          Account <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                        </span>
                      </div>
                    </div>
                    {/* Dropdown Menu */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="p-2 space-y-1">
                        <Link to="/account" className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50 rounded-md">My Profile</Link>
                        <Link to="/account" className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50 rounded-md">Orders</Link>
                        <button 
                          onClick={signOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={openAuthModal} className="flex items-center gap-2 hover:text-primary transition-colors group text-left">
                    <User className="w-6 h-6 lg:w-6 lg:h-6 text-foreground/70 group-hover:text-primary" />
                    <div className="hidden sm:flex flex-col">
                      <span className="text-[10px] text-foreground/50 leading-none">Hello, Sign in</span>
                      <span className="text-sm font-bold leading-none mt-1 flex items-center">
                        Account <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                      </span>
                    </div>
                  </button>
                )}

                {/* Wishlist */}
                <a 
                  href="/wishlist" 
                  onClick={(e) => {
                    e.preventDefault();
                    requireAuth(() => window.location.href = '/wishlist');
                  }}
                  className="hidden lg:flex flex-col items-center gap-1 hover:text-primary transition-colors relative group cursor-pointer"
                >
                  <Heart className="w-6 h-6 text-foreground/70 group-hover:text-primary" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    0
                  </span>
                  <span className="text-[10px] font-medium leading-none mt-1">Wishlist</span>
                </a>

                {/* Cart */}
                <a 
                  href="/cart"
                  onClick={(e) => {
                    e.preventDefault();
                    requireAuth(() => window.location.href = '/cart');
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors group cursor-pointer"
                >
                  <div className="relative">
                    <ShoppingCart className="w-6 h-6 lg:w-7 lg:h-7 text-foreground/80 group-hover:text-primary" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 lg:w-5 lg:h-5 bg-secondary text-white text-[10px] lg:text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className="text-[10px] text-foreground/50 leading-none opacity-0">Cart</span>
                    <span className="text-sm font-bold leading-none mt-1">Cart</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Row 2: Search Bar */}
          <div className="flex lg:hidden w-full mt-1">
            <div className="flex w-full border border-gray-300 rounded-md overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-gray-50">
              <input 
                type="text" 
                placeholder="Search..." 
                className="flex-1 px-3 py-2 outline-none text-sm text-foreground bg-transparent"
              />
              <button className="bg-primary hover:bg-primary-600 transition-colors text-white px-4 py-2 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Row 3: Deliver To */}
          <div 
            className="flex lg:hidden items-center gap-1 text-sm bg-[#e8f3f8] text-primary-900 -mx-4 px-4 py-2.5 cursor-pointer shadow-sm"
            onClick={() => setIsLocationModalOpen(true)}
          >
             <MapPin className="w-4 h-4 text-primary" />
             <span className="opacity-80">Deliver to</span>
             <span className="font-bold truncate ml-1">{location}</span>
             <ChevronDown className="w-4 h-4 ml-auto opacity-60" />
          </div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-primary text-white hidden md:block">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/category/all" className="flex items-center gap-2 py-2.5 px-3 hover:border-white/20 border border-transparent transition-colors font-medium text-sm border-r border-white/10 pr-6">
            <Menu className="w-5 h-5" /> All Categories
          </Link>
          
          <nav className="flex items-center pl-6 gap-6">
            <Link to="/today-deals" className="relative text-sm font-bold text-primary-900 bg-gradient-to-r from-accent to-yellow-400 hover:from-yellow-400 hover:to-accent transition-all px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2 transform hover:scale-105">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Today's Deals
            </Link>
            <Link to="/category/bestsellers" className="text-sm font-medium hover:text-primary-100 transition-colors">Bestsellers</Link>
            <Link to="/category/books" className="text-sm font-medium hover:text-primary-100 transition-colors">Spiritual Books</Link>
            <Link to="/category/idols" className="text-sm font-medium hover:text-primary-100 transition-colors">Brass Idols</Link>
            <Link to="/category/pooja" className="text-sm font-medium hover:text-primary-100 transition-colors">Pooja Essentials</Link>
            <Link to="/category/jewellery" className="text-sm font-medium hover:text-primary-100 transition-colors">Temple Jewellery</Link>
            <Link to="/category/homam" className="text-sm font-medium hover:text-primary-100 transition-colors">Homam Samagri</Link>
            <Link to="/category/gifts" className="text-sm font-medium hover:text-primary-100 transition-colors flex items-center gap-1">
              Festive Gifts <span className="bg-secondary text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-1 animate-pulse">New</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Location Selection Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Choose your location
              </h2>
              <button onClick={() => setIsLocationModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600">
                Delivery options and delivery speeds may vary for different locations.
              </p>
              
              {/* Use Current Location */}
              <button 
                onClick={handleUseCurrentLocation}
                disabled={isFetchingLocation}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isFetchingLocation ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Crosshair className="w-5 h-5" />
                )}
                {isFetchingLocation ? 'Detecting Location...' : 'Use current location'}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase">or enter manually</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={manualAddress.doorNo}
                    onChange={(e) => setManualAddress({...manualAddress, doorNo: e.target.value})}
                    placeholder="Door No / Flat" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                  <input 
                    type="text" 
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress({...manualAddress, street: e.target.value})}
                    placeholder="Street / Area" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
                    placeholder="City *" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                  <input 
                    type="text" 
                    value={manualAddress.state}
                    onChange={(e) => setManualAddress({...manualAddress, state: e.target.value})}
                    placeholder="State" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={manualAddress.pincode}
                    onChange={(e) => setManualAddress({...manualAddress, pincode: e.target.value})}
                    placeholder="Pincode *" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyManualAddress()}
                  />
                  <button 
                    onClick={handleApplyManualAddress}
                    className="bg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
