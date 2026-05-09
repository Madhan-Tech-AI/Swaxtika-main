// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface PlaceOrderPayload {
  items: OrderItem[];
  shipping_address: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    pin: string;
  };
  payment_method: "upi" | "card" | "cod";
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const payload: PlaceOrderPayload = await req.json();

    // Validate required fields
    const { shipping_address, payment_method, items } = payload;
    if (!shipping_address?.fullName?.trim()) throw new Error("Full name is required");
    if (!shipping_address?.phone?.trim() || shipping_address.phone.length < 10) throw new Error("Valid phone is required");
    if (!shipping_address?.address?.trim()) throw new Error("Address is required");
    if (!shipping_address?.city?.trim()) throw new Error("City is required");
    if (!shipping_address?.pin?.trim() || shipping_address.pin.length < 6) throw new Error("Valid PIN is required");
    if (!payment_method) throw new Error("Payment method is required");
    if (!items || items.length === 0) throw new Error("Cart is empty");

    // For non-COD: verify payment
    if (payment_method !== "cod") {
      if (!payload.razorpay_payment_id || !payload.razorpay_order_id) {
        throw new Error("Payment verification required for non-COD orders");
      }
      // Verify with Razorpay webhook signature (done separately in verify-payment function)
    }

    // Fetch the user's profile to get the actual account owner details
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email, mobile_number')
      .eq('id', user.id)
      .single();

    const accountName = profile && (profile.first_name || profile.last_name) 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
      : (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : shipping_address.fullName);
      
    const accountEmail = profile?.email || user.email;
    const accountPhone = profile?.mobile_number || shipping_address.phone;

    // BEGIN: Atomic order creation using DB function
    const { data: orderResult, error: orderError } = await supabaseAdmin.rpc(
      "create_order_atomic",
      {
        p_user_id: user.id,
        p_customer_name: accountName,
        p_customer_email: accountEmail,
        p_customer_phone: accountPhone,
        p_shipping_address: shipping_address,
        p_item_ids: items.map(i => i.product_id),
        p_item_quantities: items.map(i => i.quantity),
        p_payment_method: payment_method,
        p_razorpay_order_id: payload.razorpay_order_id || null,
        p_razorpay_payment_id: payload.razorpay_payment_id || null,
      }
    );

    if (orderError) throw orderError;

    return new Response(
      JSON.stringify({ success: true, order_id: orderResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
