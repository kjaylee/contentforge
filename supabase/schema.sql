-- ContentForge Supabase Schema
-- 비용: $0 (무료 티어)

-- =====================
-- USERS 테이블
-- =====================
-- Supabase Auth와 연동되는 사용자 프로필
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'creator', 'pro', 'agency')),
  monthly_generations INT DEFAULT 0,  -- 이번 달 사용량
  generation_reset_at TIMESTAMPTZ DEFAULT NOW(),  -- 월 초 리셋
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 새 유저 생성 시 자동으로 users 테이블에 추가
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- GENERATIONS 테이블
-- =====================
-- 콘텐츠 변환 기록
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 입력
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'text')),
  source_url TEXT,  -- URL 입력 시
  source_text TEXT NOT NULL,  -- 원본 텍스트 (크롤링 결과 또는 직접 입력)
  source_title TEXT,
  
  -- 출력 (JSON으로 여러 플랫폼 결과 저장)
  outputs JSONB NOT NULL DEFAULT '{}',
  -- 예시: {"twitter": "...", "linkedin": "...", "instagram": "..."}
  
  -- 선택한 플랫폼들
  platforms TEXT[] NOT NULL,
  
  -- 메타데이터
  tokens_used INT DEFAULT 0,
  processing_time_ms INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- =====================
-- SUBSCRIPTIONS 테이블
-- =====================
-- Stripe 구독 정보 (결제 연동 시 사용)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe 정보
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- 구독 상태
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'canceled', 'past_due')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'creator', 'pro', 'agency')),
  
  -- 기간
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- =====================
-- RLS (Row Level Security)
-- =====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: 자기 데이터만 조회/수정
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Generations: 자기 데이터만 조회/생성
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: 자기 구독만 조회
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================
-- 티어별 제한
-- =====================
-- free: 월 5회, 3개 플랫폼
-- creator: 월 100회, 모든 플랫폼
-- pro: 무제한
-- agency: 무제한 + 팀

COMMENT ON TABLE users IS 'ContentForge 사용자 프로필';
COMMENT ON TABLE generations IS '콘텐츠 변환 기록';
COMMENT ON TABLE subscriptions IS 'Stripe 구독 정보';
