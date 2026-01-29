import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { crawlUrl } from '@/lib/crawler';
import { generateContent, isOpenAIConfigured } from '@/lib/openai';
import { PLANS } from '@/lib/stripe';
import type { Platform } from '@/types/database';

const VALID_PLATFORMS: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'threads'];

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API가 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 사용자 정보 및 제한 확인
    let userId: string | null = null;
    let isPro = false;
    let dailyUsed = 0;

    if (user) {
      userId = user.id;

      // 구독 상태 확인
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .single();

      isPro = subscription?.status === 'active' && subscription?.tier === 'pro';

      // 오늘 사용량 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      dailyUsed = count || 0;

      // 무료 사용자 제한 체크
      if (!isPro && dailyUsed >= PLANS.free.dailyLimit) {
        return NextResponse.json(
          {
            error: '오늘 무료 사용량을 모두 소진했습니다. Pro로 업그레이드하면 무제한으로 사용할 수 있어요!',
            usage: { used: dailyUsed, limit: PLANS.free.dailyLimit },
          },
          { status: 429 }
        );
      }
    } else {
      // 비로그인 사용자: IP 기반 간단 체크 (세션당 1회만 허용)
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'anonymous';
      
      // 프로덕션에서는 Redis 등으로 관리하는 게 좋지만, MVP에선 허용
      // 로그인을 유도하기 위해 메시지 추가
    }

    // 요청 파싱
    const body = await request.json();
    const { url, text, platforms, language = 'ko' } = body;

    // 입력 검증
    if (!url && !text) {
      return NextResponse.json(
        { error: 'URL 또는 텍스트 중 하나를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: '최소 하나의 플랫폼을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 플랫폼 유효성 검사
    const validPlatforms = platforms.filter(
      (p): p is Platform => VALID_PLATFORMS.includes(p as Platform)
    );

    if (validPlatforms.length === 0) {
      return NextResponse.json(
        { error: '유효한 플랫폼을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 플랫폼 제한: 무료 3개, Pro 5개
    const maxPlatforms = isPro ? PLANS.pro.platforms : PLANS.free.platforms;
    const limitedPlatforms = validPlatforms.slice(0, maxPlatforms);

    // 소스 텍스트 준비
    let sourceText: string;
    let sourceTitle: string | undefined;
    let sourceUrl: string | undefined;

    if (url) {
      // URL 크롤링
      const crawlResult = await crawlUrl(url);
      
      if (!crawlResult.success) {
        return NextResponse.json(
          { error: crawlResult.error || 'URL 크롤링에 실패했습니다.' },
          { status: 400 }
        );
      }

      sourceText = crawlResult.content;
      sourceTitle = crawlResult.title;
      sourceUrl = url;
    } else {
      // 직접 입력 텍스트
      sourceText = text.trim();
      
      if (sourceText.length < 50) {
        return NextResponse.json(
          { error: '텍스트가 너무 짧습니다. 최소 50자 이상 입력해주세요.' },
          { status: 400 }
        );
      }
      
      if (sourceText.length > 10000) {
        sourceText = sourceText.slice(0, 10000);
      }
    }

    // 콘텐츠 생성
    const result = await generateContent({
      sourceText,
      sourceTitle,
      platforms: limitedPlatforms,
      language: language === 'en' ? 'en' : 'ko',
    });

    // 생성 기록 저장 (로그인 사용자만)
    if (userId) {
      const serviceClient = createServiceClient();
      await serviceClient
        .from('generations')
        .insert({
          user_id: userId,
          source_type: url ? 'url' : 'text',
          source_url: sourceUrl || null,
          source_text: sourceText.slice(0, 5000), // 저장 제한
          source_title: sourceTitle || null,
          outputs: result.outputs,
          platforms: limitedPlatforms,
          tokens_used: result.tokensUsed,
          processing_time_ms: result.processingTimeMs,
        });
    }

    // 응답
    const dailyLimit = isPro ? Infinity : PLANS.free.dailyLimit;
    const newUsed = dailyUsed + 1;

    return NextResponse.json({
      success: true,
      source: {
        type: url ? 'url' : 'text',
        url: sourceUrl,
        title: sourceTitle,
        textLength: sourceText.length,
      },
      outputs: result.outputs,
      platforms: limitedPlatforms,
      usage: {
        used: newUsed,
        limit: dailyLimit,
        remaining: isPro ? Infinity : Math.max(0, dailyLimit - newUsed),
      },
      meta: {
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
      },
      loginPrompt: !userId ? '로그인하면 사용 기록이 저장되고 더 많은 기능을 사용할 수 있어요!' : undefined,
    });
  } catch (error) {
    console.error('Generate API Error:', error);
    
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'ContentForge Generate API',
    version: '1.0.0',
    platforms: VALID_PLATFORMS,
    limits: {
      free: { dailyGenerations: PLANS.free.dailyLimit, maxPlatforms: PLANS.free.platforms },
      pro: { dailyGenerations: 'unlimited', maxPlatforms: PLANS.pro.platforms },
    },
  });
}
