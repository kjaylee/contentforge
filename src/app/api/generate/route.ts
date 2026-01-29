import { NextRequest, NextResponse } from 'next/server';
import { crawlUrl } from '@/lib/crawler';
import { generateContent, isOpenAIConfigured } from '@/lib/openai';
import type { Platform } from '@/types/database';

const VALID_PLATFORMS: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'threads'];
const FREE_TIER_LIMIT = 5;

// 간단한 인메모리 사용량 추적 (MVP용 - 프로덕션에서는 Supabase 사용)
const usageTracker = new Map<string, { count: number; resetAt: Date }>();

function getUsage(ip: string): { count: number; remaining: number } {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let usage = usageTracker.get(ip);
  
  // 월 초 리셋
  if (!usage || usage.resetAt < firstOfMonth) {
    usage = { count: 0, resetAt: firstOfMonth };
    usageTracker.set(ip, usage);
  }
  
  return {
    count: usage.count,
    remaining: Math.max(0, FREE_TIER_LIMIT - usage.count),
  };
}

function incrementUsage(ip: string): void {
  const usage = usageTracker.get(ip);
  if (usage) {
    usage.count += 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API가 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    // IP 기반 사용량 체크 (MVP 단순화)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    
    const usage = getUsage(ip);
    if (usage.remaining <= 0) {
      return NextResponse.json(
        { 
          error: '이번 달 무료 사용량을 모두 소진했습니다.',
          usage: { used: usage.count, limit: FREE_TIER_LIMIT },
        },
        { status: 429 }
      );
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

    // 무료 티어: 최대 3개 플랫폼
    const limitedPlatforms = validPlatforms.slice(0, 3);

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

    // 사용량 증가
    incrementUsage(ip);

    // 응답
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
        used: usage.count + 1,
        limit: FREE_TIER_LIMIT,
        remaining: usage.remaining - 1,
      },
      meta: {
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
      },
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
      free: { monthlyGenerations: FREE_TIER_LIMIT, maxPlatforms: 3 },
    },
  });
}
