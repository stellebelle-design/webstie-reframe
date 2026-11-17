import Stripe from "npm:stripe@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.reframelifecoaching.co.uk",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const products = {
  personalised_programme: { priceEnv: "STRIPE_PRICE_PERSONALISED_PROGRAMME", mode: "payment" },
  coaching_4_week: { priceEnv: "STRIPE_PRICE_COACHING_4_WEEK", mode: "payment" },
  coaching_8_week: { priceEnv: "STRIPE_PRICE_COACHING_8_WEEK", mode: "payment" },
  coaching_12_week: { priceEnv: "STRIPE_PRICE_COACHING_12_WEEK", mode: "payment" },
  coaching_6_month: { priceEnv: "STRIPE_PRICE_COACHING_6_MONTH", mode: "subscription" },
} as const;

type ProductKey = keyof typeof products;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      return Response.json({ error: "Stripe has not been configured yet." }, { status: 500, headers: corsHeaders });
    }

    const body = await req.json();
    const productKey = body?.productKey as ProductKey;
    if (!productKey || !Object.hasOwn(products, productKey)) {
      return Response.json({ error: "Please choose a valid Reframe Life product." }, { status: 400, headers: corsHeaders });
    }

    const product = products[productKey];
    const priceId = Deno.env.get(product.priceEnv);
    if (!priceId || !priceId.startsWith("price_")) {
      return Response.json({ error: "The selected product price has not been configured yet." }, { status: 500, headers: corsHeaders });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-03-25.dahlia" as never,
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: "form" as never,
      mode: product.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      submit_type: "auto",
      // Checkout Studio integration identifier supplied for this embedded form.
      // @ts-expect-error Checkout Studio parameter is newer than some SDK type definitions.
      integration_identifier: "custom_embedded_web_0001",
    };

    if (product.mode === "subscription") {
      sessionParams.payment_method_collection = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.client_secret) {
      throw new Error("Stripe did not return a Checkout form client secret.");
    }

    return Response.json({ client_secret: session.client_secret }, { headers: corsHeaders });
  } catch (error) {
    console.error("Stripe Checkout session creation failed:", error);
    return Response.json({ error: "We couldn't start secure checkout. Please try again or contact Reframe Life." }, { status: 500, headers: corsHeaders });
  }
});
