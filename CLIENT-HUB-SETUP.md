# Reframe Life Client Hub — prototype

This branch adds a visual, front-end prototype of the private client resource area.

## Files
- `client-hub.html` — dashboard, recipe library and sample resource sections.
- `client-hub.css` — responsive styling using the existing Reframe Life cream, stone and typography design language.
- `client-hub.js` — client-side recipe search, category filters and sample recipe dialogs.

## Preview
Open `client-hub.html` from this branch in a local preview or configure a separate preview deployment. The main website's `index.html` and `style.css` are intentionally unchanged.

## Important: not ready for real client access
This is a design prototype only. It does **not** implement authentication, payment verification, member permissions or private data storage. Do not put private client information, paid-only materials or credentials in this repository. The repository is public.

Before launch, connect a real authentication and data service (for example Supabase) and enforce access on the server/database side. A hidden page, client-side password check or an unlinked URL is not access control. Paid status should be verified server-side through a trusted payment/webhook workflow, and access should be revoked when a membership ends.

## Suggested production steps
1. Confirm the website's hosting and preview deployment approach.
2. Create a Supabase project and configure authentication.
3. Create a members table linked to authenticated user IDs, with an active-membership status maintained by a trusted server-side process.
4. Add Row Level Security policies to all member-only tables and storage buckets.
5. Keep privileged service-role keys and payment webhook secrets in server-side environment variables only; never commit them to this public repository or expose them in browser JavaScript.
6. Decide which resources are general client resources and which, if any, are individually assigned.
7. Test unauthorised access, expired memberships, password reset and mobile layouts before launch.
8. Only then add a visible Client Hub link to the public website.

Sample recipes are illustrative content. Confirm ingredients, quantities, food safety and any nutritional calculations before publishing them as coaching resources.
