(function initialiseReframeCheckout() {
  const status = document.querySelector("#checkout-status");
  const panel = document.querySelector("#checkout-panel");
  const products = document.querySelector("#checkout-products");
  const accountGate = document.querySelector("#account-gate");
  const accountForm = document.querySelector("#account-form");
  const accountStatus = document.querySelector("#account-status");
  const emailInput = document.querySelector("#account-email");
  const passwordInput = document.querySelector("#account-password");
  const confirmPasswordInput = document.querySelector("#account-confirm-password");
  const confirmPasswordLabel = document.querySelector("#confirm-password-label");
  const createButton = document.querySelector("#create-account-button");
  const signInButton = document.querySelector("#show-signin-button");
  const accountHeading = document.querySelector("#account-heading");
  const accountIntro = document.querySelector("#account-intro");
  const signedInSummary = document.querySelector("#signed-in-summary");
  const signedInEmail = document.querySelector("#signed-in-email");
  const accountSignOutButton = document.querySelector("#account-signout-button");
  const productButtons = document.querySelectorAll("[data-product]");
  const requestedProduct = new URLSearchParams(window.location.search).get("product");
  const validProductKeys = [
    "personalised_programme",
    "coaching_4_week",
    "coaching_8_week",
    "coaching_12_week",
    "coaching_6_month"
  ];
  const selectedProduct = validProductKeys.includes(requestedProduct) ? requestedProduct : null;

  // If the visitor chose a programme on the website, show only that
  // programme after sign-in so they do not have to choose twice.
  if (selectedProduct) {
    productButtons.forEach((button) => {
      if (button.dataset.product !== selectedProduct) {
        button.closest("article").hidden = true;
      } else {
        button.textContent = "Continue to secure checkout";
      }
    });
  }
  const config = window.REFRAME_SUPABASE_CONFIG;
  const supabase = window.supabase && config?.url && config?.publishableKey
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;
  let accountMode = "signup";

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

  function showAccountStatus(message, isError = false) {
    accountStatus.textContent = message;
    accountStatus.style.color = isError ? "#a33b35" : "inherit";
  }

  function setAccountMode(mode) {
    accountMode = mode;
    const signingUp = mode === "signup";
    accountHeading.textContent = signingUp ? "Create your account" : "Welcome back";
    accountIntro.textContent = signingUp
      ? "Create an account before choosing your Reframe Life programme."
      : "Sign in to the account you want linked to your payment.";
    confirmPasswordLabel.hidden = !signingUp;
    confirmPasswordInput.hidden = !signingUp;
    confirmPasswordInput.required = signingUp;
    passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
    createButton.textContent = signingUp ? "Create account" : "Sign in";
    signInButton.textContent = signingUp ? "I already have an account" : "Create a new account";
    showAccountStatus("");
  }

  function unlockCheckout(user) {
    accountGate.querySelector("#account-form").hidden = true;
    signedInSummary.hidden = false;
    signedInEmail.textContent = "Signed in as " + (user.email || "your account") + (selectedProduct ? ". Your selected programme is ready below." : ". You can now choose your programme.");
    products.hidden = false;
  }

  function lockCheckout() {
    accountGate.querySelector("#account-form").hidden = false;
    signedInSummary.hidden = true;
    products.hidden = true;
    panel.hidden = true;
  }

  async function refreshSession() {
    if (!supabase) {
      showAccountStatus("The account service hasn't loaded. Please refresh and try again.", true);
      return;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) unlockCheckout(data.session.user);
    else lockCheckout();
  }

  signInButton.addEventListener("click", () => {
    setAccountMode(accountMode === "signup" ? "signin" : "signup");
  });

  accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) {
      showAccountStatus("The account service hasn't loaded. Please refresh and try again.", true);
      return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    createButton.disabled = true;
    signInButton.disabled = true;
    showAccountStatus(accountMode === "signup" ? "Creating your account…" : "Signing you in…");
    try {
      if (accountMode === "signup") {
        if (password !== confirmPasswordInput.value) {
          throw new Error("Your passwords don't match. Please check and try again.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.href }
        });
        if (error) throw error;
        if (data.session?.user) {
          unlockCheckout(data.session.user);
          showAccountStatus("Your account is ready. Please choose your programme below.");
        } else {
          setAccountMode("signin");
          showAccountStatus("Almost there — we've sent a confirmation email. Please verify your email, then return to this page and sign in.");
          emailInput.value = email;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        unlockCheckout(data.user);
        showAccountStatus("You're signed in. Please choose your programme below.");
      }
    } catch (error) {
      console.error("Reframe Life account error:", error);
      showAccountStatus(error.message || "We couldn't complete that request. Please try again.", true);
    } finally {
      createButton.disabled = false;
      signInButton.disabled = false;
    }
  });

  accountSignOutButton.addEventListener("click", async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    lockCheckout();
    setAccountMode("signin");
    showAccountStatus("You've been signed out.");
  });

  if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) unlockCheckout(session.user);
      else lockCheckout();
    });
    refreshSession().catch(error => {
      console.error("Reframe Life session restore error:", error);
      showAccountStatus("We couldn't restore your account session. Please sign in again.", true);
    });
  } else {
    showAccountStatus("The account service hasn't loaded. Please refresh and try again.", true);
  }

  productButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        lockCheckout();
        showAccountStatus("Please sign in before choosing a programme.", true);
        return;
      }
      productButtons.forEach((item) => { item.disabled = true; });
      showStatus("Preparing your secure checkout…");
      try {
        if (!window.REFRAME_STRIPE_PUBLISHABLE_KEY || window.REFRAME_STRIPE_PUBLISHABLE_KEY.includes("REPLACE")) {
          throw new Error("Stripe checkout is being configured and is not ready to accept payments yet.");
        }
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: { productKey: button.dataset.product }
        });
        if (error) {
          let detail = error.message || "The checkout request failed.";
          try {
            const response = error.context;
            if (response && typeof response.json === "function") {
              const body = await response.json();
              if (body?.error) detail = body.error;
            }
          } catch (_) {}
          throw new Error(detail);
        }
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
            const confirmationUrl = new URL("order-confirmed.html", window.location.href);
            confirmationUrl.searchParams.set("programme", button.dataset.product);
            const confirmationResult = await loadActionsResult.actions.confirm({
              formConfirmEvent: event,
              returnUrl: confirmationUrl.href
            });
            if (confirmationResult?.type === "success") {
              window.location.assign(confirmationUrl.href);
            } else if (confirmationResult?.type === "error") {
              const detail = confirmationResult.error?.message || "Please check your payment details and try again.";
              showStatus("Stripe couldn't confirm the payment: " + detail, true);
            }
          } catch (error) {
            console.error("Stripe payment confirmation error:", error);
            const detail = error?.message || error?.type || "Unknown Stripe confirmation error";
            showStatus("Stripe couldn't confirm the payment: " + detail, true);
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