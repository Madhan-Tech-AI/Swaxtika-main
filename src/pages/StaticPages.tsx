export function TrackOrder() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Track Your Order</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <p className="text-foreground/70 mb-6">Enter your Order ID and Phone Number to track your order status.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Order ID</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. ORD-12345" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Phone Number</label>
            <input type="tel" className="w-full border border-gray-300 rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="+91" />
          </div>
          <button onClick={() => alert('Tracking information sent to your phone.')} className="w-full bg-primary text-white font-medium py-3 rounded-md hover:bg-primary-600 transition-colors mt-4">
            Track Order
          </button>
        </div>
      </div>
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
            <p><strong>Email:</strong> support@sacredshoppe.com</p>
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
        <p>Welcome to Sacred Shoppe. By accessing or using our website, you agree to be bound by these terms of service and all applicable laws and regulations.</p>
        <p>We reserve the right to withdraw or amend the service we provide on our website without notice.</p>
      </div>
    </div>
  );
}
