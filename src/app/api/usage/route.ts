import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/stripe';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 비로그인 사용자
    if (!user) {
      return NextResponse.json({
        isLoggedIn: false,
        tier: 'free',
        dailyLimit: PLANS.free.dailyLimit,
        used: 0,
        remaining: PLANS.free.dailyLimit,
      });
    }

    // 구독 상태 확인
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription?.status === 'active' && subscription?.tier === 'pro';
    const dailyLimit = isPro ? Infinity : PLANS.free.dailyLimit;

    // 오늘 사용량 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    const used = count || 0;
    const remaining = isPro ? Infinity : Math.max(0, dailyLimit - used);

    return NextResponse.json({
      isLoggedIn: true,
      tier: isPro ? 'pro' : 'free',
      dailyLimit,
      used,
      remaining,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: '사용량 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
