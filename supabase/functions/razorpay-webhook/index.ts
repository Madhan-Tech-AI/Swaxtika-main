// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature")!;
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

    // Verify signature
    const hmac = createHmac("sha256", webhookSecret);
    hmac.update(body);
    const expectedSignature = hmac.toString();

    if (signature !== expectedSignature) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid", razorpay_payment_id: payment.id })
        .eq("razorpay_order_id", payment.order_id);
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "Cancelled" })
        .eq("razorpay_order_id", payment.order_id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
});
