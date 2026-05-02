import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CustomerLayout } from './layouts/CustomerLayout';
import { Home } from './pages/Home';

import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { TodayDeals } from './pages/TodayDeals';
import { TrackOrder, Returns, Contact, FAQ, Shipping, Privacy, Terms } from './pages/StaticPages';
import { Account, Wishlist } from './pages/AccountWishlist';

import { JoinForm } from './pages/JoinForm';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthModal />
        <Router>
        <Routes>
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<Catalog />} />
          <Route path="today-deals" element={<TodayDeals />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="returns" element={<Returns />} />
          <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
        </Route>
        <Route path="joinform" element={<JoinForm />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
