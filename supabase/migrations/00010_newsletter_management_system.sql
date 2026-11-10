-- =============================================================================
-- The Executive Brief — Newsletter Management System
-- Migration 00010
-- Secure version: preserves existing production subscribers and RLS policies
-- =============================================================================

-- 1. TEST SUBSCRIBERS
-- Exact same schema as the existing public.subscribers table.
-- The production table is NOT modified.

CREATE TABLE IF NOT EXISTS public.newsletter_test_subscribers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    status text NOT NULL DEFAULT 'active'::text,
    source text NOT NULL DEFAULT 'homepage_callout'::text,
    subscribed_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT newsletter_test_subscribers_pkey PRIMARY KEY (id),
    CONSTRAINT newsletter_test_subscribers_email_key UNIQUE (email),
    CONSTRAINT newsletter_test_check_email_format
        CHECK (
            email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )
);

-- 2. SEED THREE TEST ADDRESSES

INSERT INTO public.newsletter_test_subscribers (email, status, source)
VALUES
    ('mekalarishwanthkumar26@gmail.com', 'active', 'homepage_callout'),
    ('rishwanthmekala@gmail.com', 'active', 'homepage_callout'),
    ('21bd1a05d5cseg@gmail.com', 'active', 'homepage_callout')
ON CONFLICT (email) DO NOTHING;

-- 3. CAMPAIGNS

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name text NOT NULL,
    email_subject text NOT NULL,
    preview_text text DEFAULT '',
    sender_name text NOT NULL DEFAULT 'The Executive Brief',
    reply_to_email text,
    category text DEFAULT 'general',
    editor_content jsonb DEFAULT '{}'::jsonb,
    rendered_html text,
    featured_article_data jsonb,
    footer_data jsonb,
    status text NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'queued',
                'processing',
                'completed',
                'completed_with_errors',
                'failed',
                'cancelled'
            )
        ),
    recipient_count integer NOT NULL DEFAULT 0,
    sent_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at timestamptz,
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status
ON public.newsletter_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at
ON public.newsletter_campaigns(created_at DESC);

-- 4. CAMPAIGN RECIPIENTS

CREATE TABLE IF NOT EXISTS public.newsletter_campaign_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL
        REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    recipient_email text NOT NULL,
    subscriber_id uuid,
    status text NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'accepted',
                'failed',
                'skipped'
            )
        ),
    attempt_count integer NOT NULL DEFAULT 0,
    provider_message_id text,
    error_message text,
    sent_at timestamptz,
    last_attempt_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT newsletter_campaign_recipients_campaign_email_key
        UNIQUE (campaign_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_campaign_status
ON public.newsletter_campaign_recipients(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_email
ON public.newsletter_campaign_recipients(recipient_email);

-- 5. UNSUBSCRIBE TOKENS

CREATE TABLE IF NOT EXISTS public.newsletter_unsubscribe_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash text NOT NULL UNIQUE,
    subscriber_email text NOT NULL,
    recipient_source text NOT NULL
        CHECK (
            recipient_source IN (
                'newsletter_test_subscribers',
                'subscribers'
            )
        ),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_tokens_hash
ON public.newsletter_unsubscribe_tokens(token_hash);

-- 6. ENABLE RLS ON NEW TABLES ONLY

ALTER TABLE public.newsletter_test_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- IMPORTANT:
-- Do not alter RLS or policies on public.subscribers.
-- Do not alter RLS or policies on public.editorial_profiles.

-- 7. TEST SUBSCRIBER POLICIES

DROP POLICY IF EXISTS "Newsletter editors manage test subscribers"
ON public.newsletter_test_subscribers;

CREATE POLICY "Newsletter editors manage test subscribers"
ON public.newsletter_test_subscribers
FOR ALL
TO authenticated
USING (public.is_editor())
WITH CHECK (public.is_editor());

-- 8. CAMPAIGN POLICIES

DROP POLICY IF EXISTS "Newsletter editors manage campaigns"
ON public.newsletter_campaigns;

CREATE POLICY "Newsletter editors manage campaigns"
ON public.newsletter_campaigns
FOR ALL
TO authenticated
USING (public.is_editor())
WITH CHECK (public.is_editor());

-- 9. RECIPIENT AUDIT POLICIES
-- Editorial users can view recipient reports.
-- Server-side service-role operations manage delivery records.

DROP POLICY IF EXISTS "Newsletter editors view recipients"
ON public.newsletter_campaign_recipients;

CREATE POLICY "Newsletter editors view recipients"
ON public.newsletter_campaign_recipients
FOR SELECT
TO authenticated
USING (public.is_editor());

-- 10. UNSUBSCRIBE TOKENS
-- No direct anonymous or authenticated table access.
-- Secure server-side service-role operations handle tokens.

-- 11. RESTRICT TABLE PRIVILEGES

REVOKE ALL ON TABLE public.newsletter_test_subscribers
FROM anon, authenticated;

REVOKE ALL ON TABLE public.newsletter_campaigns
FROM anon, authenticated;

REVOKE ALL ON TABLE public.newsletter_campaign_recipients
FROM anon, authenticated;

REVOKE ALL ON TABLE public.newsletter_unsubscribe_tokens
FROM anon, authenticated;

-- Grant only the permissions needed by authenticated Editorial users.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.newsletter_test_subscribers
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.newsletter_campaigns
TO authenticated;

GRANT SELECT
ON TABLE public.newsletter_campaign_recipients
TO authenticated;

-- Service role is used only by trusted server-side operations.
GRANT ALL ON TABLE public.newsletter_test_subscribers
TO service_role;

GRANT ALL ON TABLE public.newsletter_campaigns
TO service_role;

GRANT ALL ON TABLE public.newsletter_campaign_recipients
TO service_role;

GRANT ALL ON TABLE public.newsletter_unsubscribe_tokens
TO service_role;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================