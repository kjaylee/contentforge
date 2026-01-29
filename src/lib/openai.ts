import OpenAI from 'openai';
import type { Platform, GenerationOutputs, PlatformOutput } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// 플랫폼별 설정
const PLATFORM_CONFIG: Record<Platform, {
  name: string;
  maxLength: number;
  hashtagCount: number;
  tone: string;
  guidelines: string;
}> = {
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    hashtagCount: 3,
    tone: '간결하고 임팩트 있는',
    guidelines: `
- 최대 280자 (해시태그 포함)
- 첫 문장에서 관심을 끌어야 함
- 해시태그 2-3개 (마지막에)
- 이모지 1-2개 적절히 사용
- 필요시 스레드로 분리 가능함을 암시`,
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    hashtagCount: 5,
    tone: '전문적이고 인사이트 있는',
    guidelines: `
- 최대 3000자
- 첫 줄 hook으로 시작 (펼쳐보기 전 보이는 부분)
- 3-5개 단락으로 구성
- 개인 경험이나 의견 포함
- 해시태그 3-5개 (마지막에)
- 전문적이지만 친근한 어조
- CTA(Call to Action) 포함`,
  },
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    hashtagCount: 30,
    tone: '감성적이고 시각적인',
    guidelines: `
- 최대 2200자 (본문)
- 이모지 풍부하게 사용 (문단마다 1-2개)
- 스토리텔링 형식
- 첫 줄 hook 중요 (더보기 전 표시)
- 해시태그 20-30개 (별도 섹션)
- 관련 계정 태그 제안
- 친근하고 캐주얼한 어조`,
  },
  facebook: {
    name: 'Facebook',
    maxLength: 2000,
    hashtagCount: 3,
    tone: '캐주얼하고 대화체의',
    guidelines: `
- 500-1500자 적정
- 대화하듯 편안한 어조
- 질문으로 engagement 유도
- 이모지 적당히 사용
- 해시태그 1-3개 (선택적)
- 스토리나 경험 공유 형식`,
  },
  threads: {
    name: 'Threads',
    maxLength: 500,
    hashtagCount: 0,
    tone: '대화체이고 짧은',
    guidelines: `
- 최대 500자
- 매우 짧고 핵심만
- 대화체, 친구에게 말하듯
- 해시태그 사용 안 함
- 이모지 1-2개
- 생각이나 의견 중심`,
  },
};

export interface GenerateOptions {
  sourceText: string;
  sourceTitle?: string;
  platforms: Platform[];
  language?: 'ko' | 'en';
}

export interface GenerateResult {
  outputs: GenerationOutputs;
  tokensUsed: number;
  processingTimeMs: number;
}

/**
 * 콘텐츠를 여러 플랫폼용으로 변환
 */
export async function generateContent(options: GenerateOptions): Promise<GenerateResult> {
  const { sourceText, sourceTitle, platforms, language = 'ko' } = options;
  const startTime = Date.now();

  const outputs: GenerationOutputs = {};
  let totalTokens = 0;

  // 각 플랫폼별로 생성 (병렬 처리)
  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const config = PLATFORM_CONFIG[platform];
      const prompt = buildPrompt(sourceText, sourceTitle, config, language);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 소셜 미디어 콘텐츠 전문가입니다. 주어진 가이드라인을 정확히 따라 최적화된 게시물을 작성합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const text = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;
      
      return { platform, text, tokens };
    })
  );

  // 결과 처리
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { platform, text, tokens } = result.value;
      totalTokens += tokens;
      
      const parsed = parseOutput(text, platform);
      outputs[platform] = parsed;
    } else {
      console.error(`Failed to generate for platform:`, result.reason);
    }
  }

  return {
    outputs,
    tokensUsed: totalTokens,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * 플랫폼별 프롬프트 생성
 */
function buildPrompt(
  sourceText: string,
  sourceTitle: string | undefined,
  config: typeof PLATFORM_CONFIG[Platform],
  language: 'ko' | 'en'
): string {
  const langInstruction = language === 'ko' 
    ? '한국어로 작성해주세요.' 
    : 'Write in English.';

  return `
주어진 원본 콘텐츠를 ${config.name} 플랫폼에 최적화된 게시물로 변환해주세요.

## 원본 콘텐츠
${sourceTitle ? `제목: ${sourceTitle}\n` : ''}
${sourceText}

## ${config.name} 가이드라인
- 어조: ${config.tone}
${config.guidelines}

## 요구사항
1. ${langInstruction}
2. 원본의 핵심 메시지를 유지하면서 플랫폼에 맞게 변환
3. 최대 ${config.maxLength}자 이내
4. ${config.hashtagCount > 0 ? `해시태그 ${config.hashtagCount}개 이하 포함` : '해시태그 사용 안 함'}
5. 자연스럽고 engagement를 유도하는 문체

## 출력 형식
콘텐츠만 출력하세요. 설명이나 추가 텍스트 없이 바로 게시할 수 있는 형태로.
해시태그가 있다면 콘텐츠 끝에 포함하세요.
`.trim();
}

/**
 * AI 응답 파싱
 */
function parseOutput(text: string, platform: Platform): PlatformOutput {
  const config = PLATFORM_CONFIG[platform];
  
  // 해시태그 추출
  const hashtagRegex = /#[\w가-힣]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  
  // 콘텐츠 정리
  let content = text.trim();
  
  // 길이 제한 (안전장치)
  if (content.length > config.maxLength) {
    // 해시태그 영역 보존하면서 자르기
    const hashtagSection = hashtags.join(' ');
    const mainContent = content.replace(hashtagSection, '').trim();
    const availableLength = config.maxLength - hashtagSection.length - 2;
    content = mainContent.slice(0, availableLength) + '...\n\n' + hashtagSection;
  }

  return {
    content,
    hashtags: hashtags.map(h => h.slice(1)), // # 제거
    characterCount: content.length,
  };
}

/**
 * API 키 유효성 검사
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
