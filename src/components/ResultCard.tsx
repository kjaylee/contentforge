'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Twitter, Linkedin, Instagram, Facebook, AtSign } from 'lucide-react';
import type { Platform, PlatformOutput } from '@/types/database';

const PLATFORM_META: Record<Platform, {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  maxLength: number;
}> = {
  twitter: {
    name: 'Twitter/X',
    icon: <Twitter className="w-4 h-4" />,
    color: 'text-black',
    bgColor: 'bg-gray-50',
    maxLength: 280,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    maxLength: 3000,
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    maxLength: 2200,
  },
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    maxLength: 2000,
  },
  threads: {
    name: 'Threads',
    icon: <AtSign className="w-4 h-4" />,
    color: 'text-black',
    bgColor: 'bg-gray-50',
    maxLength: 500,
  },
};

interface ResultCardProps {
  platform: Platform;
  output: PlatformOutput;
}

export function ResultCard({ platform, output }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lengthPercentage = (output.characterCount / meta.maxLength) * 100;
  const isOverLimit = output.characterCount > meta.maxLength;

  return (
    <Card className={`overflow-hidden ${meta.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-lg ${meta.color}`}>
            {meta.icon}
            {meta.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOverLimit ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {output.characterCount}/{meta.maxLength}자
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  복사
                </>
              )}
            </Button>
          </div>
        </div>
        {/* 길이 표시 바 */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : lengthPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(lengthPercentage, 100)}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
            {output.content}
          </pre>
        </div>
        
        {/* 해시태그 */}
        {output.hashtags && output.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {output.hashtags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResultsContainerProps {
  outputs: Partial<Record<Platform, PlatformOutput>>;
  platforms: Platform[];
}

export function ResultsContainer({ outputs, platforms }: ResultsContainerProps) {
  if (platforms.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        ✨ 생성된 콘텐츠
      </h2>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {platforms.map((platform) => {
          const output = outputs[platform];
          if (!output) return null;
          return (
            <ResultCard key={platform} platform={platform} output={output} />
          );
        })}
      </div>
    </div>
  );
}
