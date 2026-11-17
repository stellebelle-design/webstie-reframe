# Stripe Integration TODO

The embedded Checkout integration has been added on the `stripe-checkout-integration` branch. It is not ready to accept live payments until the values and deployment steps below are completed and tested.

## Values to Replace

The following values are placeholders and must be updated before testing or going live.

**Files containing placeholders:**
- [stripe-config.js](stripe-config.js)
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts) reads the server-side environment variables listed below.

| Field | Current Value | What to Set |
|---|---|---|
| `window.REFRAME_STRIPE_PUBLISHABLE_KEY` | `pk_test_pk_test_51UcsLYDqQdNR6pGodTL2WURb7owoxSOxUxWXlBsQ5CWGgpCqphIPQg4pqYpMV3Djfvk8t5OKjkqMfNsMKSfWaa3I00TCtYZbWE` | Your Stripe test publishable key initially; use the live publishable key only after testing. |
| `STRIPE_SECRET_KEY` | Not set | Add your Stripe test secret key as a Supabase Edge Function secret. Never place it in a browser file or GitHub. |
| `STRIPE_PRICE_PERSONALISED_PROGRAMME` | Not set | Price ID for the £30 one-off Personalised Training Programme. |
| `STRIPE_PRICE_COACHING_4_WEEK` | Not set | Price ID for the £119 one-off 4-Week Coaching Programme. |
| `STRIPE_PRICE_COACHING_8_WEEK` | Not set | Price ID for the £219 one-off 8-Week Coaching Programme. |
| `STRIPE_PRICE_COACHING_12_WEEK` | Not set | Price ID for the £309 one-off 12-Week Coaching Programme. |
| `STRIPE_PRICE_COACHING_6_MONTH` | Not set | Price ID for the £99/month recurring 6-Month Ongoing Coaching product. |

Get Price IDs from the Stripe Dashboard product's recurring or one-off price details. They begin with `price_`. Keep the test and live Price IDs separate.

## Configured Parameters

**File:** [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)

| Parameter | Value |
|---|---|
| `ui_mode` | `form` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `submit_type` | `auto` |
| `integration_identifier` | `custom_embedded_web_0001` |
| `payment_method_collection` (subscription only) | `always` |
| API version | `2026-03-25.dahlia` |

The server chooses `payment` for one-off products and `subscription` for the monthly coaching product. The browser sends only an allow-listed product key; it cannot set an amount or arbitrary Price ID.

## Setup and Next Steps

1. Add `STRIPE_SECRET_KEY` and all five `STRIPE_PRICE_...` values as Supabase Edge Function secrets. Do not commit secrets to GitHub.
2. Replace the public placeholder in `stripe-config.js` with your Stripe test publishable key.
3. Deploy the Supabase Edge Function:
   `supabase functions deploy create-checkout-session --project-ref mzzujnceyspsvlbllzst`
4. Publish the website changes from this branch only after reviewing them.
5. Open `/checkout.html` on the deployed test site and test every product using Stripe test mode and test card `4242 4242 4242 4242`, a future expiry date and any CVC.
6. Confirm the one-off products create payment-mode sessions and the £99 product creates a subscription-mode session.
7. Configure and test the six-month minimum commitment and subsequent rolling monthly billing separately. The current recurring Price creates a monthly subscription; it does not itself enforce a six-month minimum.
8. Configure a verified Stripe webhook and fulfilment flow before granting client-hub access or marking orders as paid. Checkout completion in the browser alone must never grant access.
9. Review customer terms, cancellation wording, privacy information and UK consumer-law requirements before accepting payments.
10. Only after successful test-mode checks, replace test credentials and test Price IDs with live values and repeat the deployment.

## Project Structure

- `checkout.html` — standalone embedded checkout page.
- `checkout.js` — loads the selected product's Checkout Session and mounts Stripe's embedded form.
- `stripe-config.js` — public publishable-key configuration only.
- `supabase/functions/create-checkout-session/index.ts` — server-side Checkout Session endpoint.

## How It Works

A customer chooses one of the five Reframe Life products on `checkout.html`. The browser sends an allow-listed product key to the Supabase Edge Function. The function maps that key to a server-side Stripe Price ID, creates the Checkout Session using the configured Stripe secret, and returns the session client secret. Stripe.js renders the payment form in its hosted iframe and confirms the payment.

No Stripe secret key is exposed in the browser. This initial integration does not yet implement webhook-based order fulfilment, subscription persistence, automatic client-hub access, or six-month cancellation enforcement.

## Resources

- https://dashboard.stripe.com/test/apikeys
- https://dashboard.stripe.com/prices
- https://docs.stripe.com/checkout
- https://docs.stripe.com/mcp
- https://support.stripe.com
