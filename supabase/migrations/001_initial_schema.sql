-- ============================================================
-- VINITALY SOCIAL - Initial Database Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE post_status AS ENUM (
  'draft',
  'scheduled',
  'published',
  'failed',
  'pending_approval'
);

CREATE TYPE social_platform AS ENUM (
  'facebook',
  'instagram'
);

CREATE TYPE account_status AS ENUM (
  'active',
  'inactive',
  'token_expired'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'editor',
  'viewer'
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'editor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================

CREATE TABLE public.social_accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform          social_platform NOT NULL,
  account_name      TEXT NOT NULL,
  account_id        TEXT NOT NULL,
  access_token      TEXT NOT NULL,
  token_expires_at  TIMESTAMPTZ,
  status            account_status NOT NULL DEFAULT 'active',
  page_picture_url  TEXT,
  followers_count   INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, platform, account_id)
);

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX idx_social_accounts_status ON public.social_accounts(status);

-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE public.posts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  social_account_id   UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  title               TEXT,
  content             TEXT NOT NULL,
  media_urls          TEXT[] NOT NULL DEFAULT '{}',
  status              post_status NOT NULL DEFAULT 'draft',
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  platform_post_id    TEXT,
  error_message       TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX idx_posts_social_account_id ON public.posts(social_account_id);

-- ============================================================
-- ASSETS
-- ============================================================

CREATE TABLE public.assets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     BIGINT NOT NULL,
  storage_path  TEXT NOT NULL UNIQUE,
  public_url    TEXT,
  width         INTEGER,
  height        INTEGER,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_file_type ON public.assets(file_type);

-- ============================================================
-- POST ANALYTICS
-- ============================================================

CREATE TABLE public.post_analytics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  likes        INTEGER NOT NULL DEFAULT 0,
  comments     INTEGER NOT NULL DEFAULT 0,
  shares       INTEGER NOT NULL DEFAULT 0,
  reach        INTEGER NOT NULL DEFAULT 0,
  impressions  INTEGER NOT NULL DEFAULT 0,
  clicks       INTEGER NOT NULL DEFAULT 0,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_analytics_post_id ON public.post_analytics(post_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Social Accounts: users manage their own accounts
CREATE POLICY "Users can view own accounts"
  ON public.social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Posts: users manage their own posts
CREATE POLICY "Users can view own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Assets: users manage their own assets
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Post Analytics: users can view analytics for their posts
CREATE POLICY "Users can view own post analytics"
  ON public.post_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_analytics.post_id
        AND posts.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create assets bucket (run via Supabase dashboard or management API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Storage RLS policies
-- CREATE POLICY "Users can upload own assets"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Public read for assets"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'assets');

-- CREATE POLICY "Users can delete own assets"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
