# The Executive Brief — Newsletter Management System
## Local Development, Testing & Production Transition Guide

This guide details the complete local setup, testing workflow, Gmail SMTP integration, and production switching procedure for the Newsletter Centre in the Editorial Dashboard of **The Executive Brief** (Osmania University Department of Business Management).

---

## 1. Required Local Environment Variables

Populate your local `.env.local` file with the following keys (without committing secrets to Git):

```env
# Database & Authentication
CONTENT_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SESSION_SECRET=your-random-32-char-session-signing-secret

# Newsletter & Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-gmail-app-password

# Sender & Reply-To Identities
NEWSLETTER_FROM_NAME="The Executive Brief"
NEWSLETTER_FROM_EMAIL=executivebrief@oudbm.ac.in
NEWSLETTER_REPLY_TO=executivebrief@oudbm.ac.in

# Central Recipient Source ('newsletter_test_subscribers' during testing, 'subscribers' in production)
NEWSLETTER_RECIPIENT_SOURCE=newsletter_test_subscribers

# Cryptographically Secure Unsubscribe Signing Secret
NEWSLETTER_UNSUBSCRIBE_SECRET=your-random-32-char-unsubscribe-secret
```

---

## 2. How to Configure Gmail SMTP Locally

1. Go to your Google Account security portal: https://myaccount.google.com/security
2. Ensure **2-Step Verification** is enabled for your account.
3. Navigate to **App Passwords** (search "App passwords" in Google Account settings).
4. Create a new App Password named `The Executive Brief Local Dev`.
5. Copy the generated 16-character string (format: `xxxx xxxx xxxx xxxx`).
6. Set in `.env.local`:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```
7. Never expose or commit this password.

---

## 3. How to Apply Database Migrations

The newsletter schema is defined in:
`supabase/migrations/00010_newsletter_management_system.sql`

To apply:
- **Via Supabase Dashboard:**
  Open your project at `https://supabase.com/dashboard/project/nhszuhtnojqcnlbwuuzv` -> **SQL Editor** -> Paste and execute `supabase/migrations/00010_newsletter_management_system.sql`.
- **Via Supabase CLI:**
  ```bash
  supabase db push
  ```

---

## 4. How to Seed the Three Test Subscribers

The migration automatically executes the idempotent seed:
```sql
insert into public.newsletter_test_subscribers (email, status, source)
values 
  ('mekalarishwanthkumar26@gmail.com', 'active', 'homepage_callout'),
  ('rishwanthmekala@gmail.com', 'active', 'homepage_callout'),
  ('21bd1a05d5cseg@gmail.com', 'active', 'homepage_callout')
on conflict (email) do nothing;
```
If executing manually in the SQL Editor, rerun the snippet above. It will never create duplicates or modify `public.subscribers`.

---

## 5. How to Start the Application Locally

```bash
# Install dependencies if not already done
pnpm install

# Start local Next.js development server
pnpm dev
```
Access the application at: `http://localhost:3000`  
Access the Editorial Dashboard at: `http://localhost:3000/admin`

---

## 6. How to Verify SMTP Connectivity

1. Log in to the Editorial Dashboard (`/admin`).
2. Click **Newsletter Centre** in the top navigation bar.
3. Click the **Verify SMTP** button in the top right header (or switch to the **SMTP Gateway** tab and click **Execute Handshake Test**).
4. The system attempts a non-sending connection handshake using `nodemailer.verify()` and returns immediate feedback:
   - Green banner: `Connected successfully to smtp.gmail.com:465`.
   - Red banner: Descriptive error message without leaking credentials.

---

## 7. How to Perform the First Authorized Test Send

1. In the **Newsletter Centre**, click **Create Newsletter**.
2. Fill in:
   - **Campaign Name:** e.g. `Test Dispatch Vol. 1`
   - **Email Subject:** e.g. `Testing The Executive Brief Weekly Dispatch`
   - **Content:** Format text using the Tiptap toolbar, upload/insert images.
   - **Featured Article:** Optional card with URL and button text.
   - **Footer:** Branded footer fields.
3. Click **Preview Email** to inspect desktop (600px) and mobile (375px) renderings.
4. Click **Send Campaign**:
   - A confirmation dialog appears displaying the campaign name, subject, and exact recipient count (`3 Active Subscribers`).
   - Click **Authorize Send**.
   - Watch the live progress bar as bounded batches are processed with delivery status updates.
   - Upon completion, click **View Delivery Report**.

---

## 8. How to Verify Campaign History & Delivery Reports

1. In the **Newsletter Centre**, click the **All Campaigns** or **Dispatched** tab.
2. Click on the campaign name or **Report** button.
3. Inspect:
   - Total snapshot pool count.
   - Accepted count (with provider message IDs).
   - Failed count (if any, with exact SMTP rejection reasons).
   - Bounded **Retry Failed** action.
   - **Duplicate** action for creating future iterations.

---

## 9. How to Verify Unsubscribe Functionality

1. Open any sent email (or generated preview) and click the **Unsubscribe** link in the footer.
2. The URL navigates to `/unsubscribe?token=...`.
3. Click **Confirm Unsubscribe**.
4. The recipient's record is marked `status = 'unsubscribed'` in the active repository.
5. In the Editorial Dashboard, verify that the active subscriber count decreases by 1 and the unsubscribed address is automatically excluded from all subsequent campaign snapshots.

---

## 10. The One-Setting Switch to Production

When local verification is complete and you are ready to transition to the production subscriber pool:

Change **one single line** in your environment configuration:

```diff
- NEWSLETTER_RECIPIENT_SOURCE=newsletter_test_subscribers
+ NEWSLETTER_RECIPIENT_SOURCE=subscribers
```

**Zero code modifications required:**
- Both tables share the exact identical schema.
- Campaign history and delivery audit logs remain fully intact.
- The central server-only repository routes all queries to `public.subscribers`.
- Unsubscribe links continue functioning seamlessly.
