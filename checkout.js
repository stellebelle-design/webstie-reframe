(function initialiseReframeCheckout() {
  const status = document.querySelector("#checkout-status");
  const panel = document.querySelector("#checkout-panel");
  const productButtons = document.querySelectorAll("[data-product]");
  const appearance = {
    theme: "stripe",
    labels: "auto",
    inputs: "spaced",
    variables: {
      borderRadius: "4px",
      colorBackground: "#ffffff",
      colorDanger: "#df1b41",
      colorPrimary: "#857b6d",
      colorSuccess: "#00875a",
      colorText: "#30313d",
      fontFamily: "Jost, sans-serif",
      fontSizeBase: "16px",
      spacingUnit: "4px"
    }
  };

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? "#a33b35" : "inherit";
  }

  productButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      productButtons.forEach((item) => { item.disabled = true; });
      showStatus("Preparing your secure checkout…");
      try {
        const config = window.REFRAME_SUPABASE_CONFIG;
        if (!window.supabase || !config?.url || !config?.publishableKey) {
          throw new Error("The checkout service is not available. Please try again shortly.");
        }
        if (!window.REFRAME_STRIPE_PUBLISHABLE_KEY || window.REFRAME_STRIPE_PUBLISHABLE_KEY.includes("REPLACE")) {
          throw new Error("Stripe checkout is being configured and is not ready to accept payments yet.");
        }

        const supabase = window.supabase.createClient(config.url, config.publishableKey);
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: { productKey: button.dataset.product }
        });
        if (error) throw error;
        if (!data?.client_secret) throw new Error(data?.error || "Stripe did not return a checkout session.");

        const stripe = Stripe(window.REFRAME_STRIPE_PUBLISHABLE_KEY);
        const checkout = stripe.initCheckoutFormSdk({ clientSecret: data.client_secret, appearance });
        const form = checkout.createForm({ layout: "expanded" });
        panel.hidden = false;
        form.mount("#checkout-form");

        const loadActionsResult = await checkout.loadActions();
        if (loadActionsResult.type !== "success") {
          throw new Error("The payment form could not be loaded. Please refresh and try again.");
        }
        form.on("confirm", async (event) => {
          try {
            await loadActionsResult.actions.confirm({ formConfirmEvent: event });
          } catch (error) {
            console.error("Stripe payment confirmation error:", error);
            showStatus("Your payment couldn't be confirmed. Please check the form and try again.", true);
          }
        });
        showStatus("Your secure payment form is ready.");
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        console.error("Reframe Life checkout error:", error);
        showStatus(error.message || "We couldn't start checkout. Please try again.", true);
        productButtons.forEach((item) => { item.disabled = false; });
      }
    });
  });
})();
