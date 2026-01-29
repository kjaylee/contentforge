'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link, FileText, Sparkles } from 'lucide-react';
import type { Platform, GenerationOutputs } from '@/types/database';

const PLATFORMS: { id: Platform; name: string; icon: string; color: string }[] = [
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: 'bg-blue-500' },
  { id: 'threads', name: 'Threads', icon: '@', color: 'bg-black' },
];

interface GenerateFormProps {
  onGenerate: (outputs: GenerationOutputs, platforms: Platform[]) => void;
}

export function GenerateForm({ onGenerate }: GenerateFormProps) {
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter', 'linkedin']);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      }
      // 무료 티어: 최대 3개
      if (prev.length >= 3) {
        return [...prev.slice(1), platform];
      }
      return [...prev, platform];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputMode === 'url' ? url : undefined,
          text: inputMode === 'text' ? text : undefined,
          platforms: selectedPlatforms,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '생성에 실패했습니다.');
      }

      setUsage(data.usage);
      onGenerate(data.outputs, data.platforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          콘텐츠 변환
        </CardTitle>
        <CardDescription>
          URL이나 텍스트를 입력하면 각 SNS에 최적화된 게시물로 변환해드립니다.
          {usage && (
            <Badge variant="outline" className="ml-2">
              {usage.limit - usage.used}회 남음
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 입력 모드 선택 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={inputMode === 'url' ? 'default' : 'outline'}
              onClick={() => setInputMode('url')}
              className="flex-1"
            >
              <Link className="w-4 h-4 mr-2" />
              URL 입력
            </Button>
            <Button
              type="button"
              variant={inputMode === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMode('text')}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              텍스트 입력
            </Button>
          </div>

          {/* URL 입력 */}
          {inputMode === 'url' && (
            <div>
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                블로그, 뉴스 기사, 문서 URL을 입력하세요.
              </p>
            </div>
          )}

          {/* 텍스트 입력 */}
          {inputMode === 'text' && (
            <div>
              <Textarea
                placeholder="변환할 텍스트를 입력하세요... (최소 50자)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {text.length}/10000자
              </p>
            </div>
          )}

          {/* 플랫폼 선택 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              플랫폼 선택 (최대 3개)
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedPlatforms.includes(platform.id)
                      ? `${platform.color} text-white shadow-md scale-105`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <span className="mr-1">{platform.icon}</span>
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* 언어 선택 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={language === 'ko' ? 'default' : 'outline'}
              onClick={() => setLanguage('ko')}
              size="sm"
            >
              🇰🇷 한국어
            </Button>
            <Button
              type="button"
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
              size="sm"
            >
              🇺🇸 English
            </Button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={isLoading || selectedPlatforms.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                변환 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                콘텐츠 생성하기
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
