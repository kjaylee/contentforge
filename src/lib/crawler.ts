import { load } from 'cheerio';

export interface CrawlResult {
  title: string;
  description: string;
  content: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * URL에서 본문 텍스트와 메타데이터를 추출
 */
export async function crawlUrl(url: string): Promise<CrawlResult> {
  try {
    // URL 유효성 검사
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('HTTP 또는 HTTPS URL만 지원됩니다.');
    }

    // 페이지 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentForge/1.0; +https://contentforge.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // 불필요한 요소 제거
    $('script, style, nav, footer, header, aside, iframe, noscript, .ad, .advertisement, .sidebar').remove();
    $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    // 메타데이터 추출
    const title = $('meta[property="og:title"]').attr('content') 
      || $('meta[name="twitter:title"]').attr('content')
      || $('title').text().trim()
      || '';

    const description = $('meta[property="og:description"]').attr('content')
      || $('meta[name="twitter:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || '';

    // 본문 추출 (우선순위)
    let content = '';
    
    // 1. article 태그 시도
    const article = $('article').first();
    if (article.length) {
      content = extractText(article, $);
    }
    
    // 2. main 태그 시도
    if (!content) {
      const main = $('main').first();
      if (main.length) {
        content = extractText(main, $);
      }
    }
    
    // 3. 특정 클래스명 시도 (일반적인 블로그/뉴스 구조)
    if (!content) {
      const contentSelectors = [
        '.post-content', '.entry-content', '.article-content',
        '.post-body', '.article-body', '.content-body',
        '[itemprop="articleBody"]', '.markdown-body',
      ];
      
      for (const selector of contentSelectors) {
        const el = $(selector).first();
        if (el.length) {
          content = extractText(el, $);
          break;
        }
      }
    }
    
    // 4. body fallback
    if (!content) {
      content = extractText($('body'), $);
    }

    // 텍스트 정리
    content = cleanText(content);

    // 최소 길이 체크
    if (content.length < 100) {
      throw new Error('추출된 콘텐츠가 너무 짧습니다. 다른 URL을 시도하거나 직접 텍스트를 입력해주세요.');
    }

    // 최대 길이 제한 (8000자 - Gemini 입력 최적화)
    if (content.length > 8000) {
      content = content.slice(0, 8000) + '...';
    }

    return {
      title: title.slice(0, 200),
      description: description.slice(0, 500),
      content,
      url,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      title: '',
      description: '',
      content: '',
      url,
      success: false,
      error: message,
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cheerio 요소에서 텍스트 추출
 */
function extractText(element: any, $: any): string {
  // 줄바꿈 보존을 위해 p, br, div 등에 줄바꿈 추가
  element.find('p, br, div, h1, h2, h3, h4, h5, h6, li').each((_: number, el: any) => {
    $(el).append('\n');
  });
  
  return element.text();
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * 텍스트 정리
 */
function cleanText(text: string): string {
  return text
    // 여러 줄바꿈을 하나로
    .replace(/\n{3,}/g, '\n\n')
    // 여러 공백을 하나로
    .replace(/[ \t]+/g, ' ')
    // 각 줄 앞뒤 공백 제거
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}
