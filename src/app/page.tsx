'use client';

import { useState } from 'react';
import { GenerateForm } from '@/components/GenerateForm';
import { ResultsContainer } from '@/components/ResultCard';
import { Separator } from '@/components/ui/separator';
import type { Platform, GenerationOutputs } from '@/types/database';

export default function Home() {
  const [outputs, setOutputs] = useState<GenerationOutputs | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const handleGenerate = (newOutputs: GenerationOutputs, newPlatforms: Platform[]) => {
    setOutputs(newOutputs);
    setPlatforms(newPlatforms);
    
    // 결과 영역으로 스크롤
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ContentForge
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            하나의 콘텐츠를 모든 SNS에 최적화된 형태로 변환하세요.
            <br />
            AI가 각 플랫폼의 특성에 맞게 자동으로 재작성합니다.
          </p>
        </header>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-12 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">🔗</div>
            <div className="font-medium">URL 또는 텍스트</div>
            <div className="text-sm text-gray-500">자동 크롤링 지원</div>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-medium">5개 플랫폼</div>
            <div className="text-sm text-gray-500">각각 최적화된 톤</div>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-medium">무료 시작</div>
            <div className="text-sm text-gray-500">월 5회 무료</div>
          </div>
        </div>

        {/* Generate Form */}
        <GenerateForm onGenerate={handleGenerate} />

        {/* Results */}
        {outputs && platforms.length > 0 && (
          <>
            <Separator className="my-8" />
            <div id="results">
              <ResultsContainer outputs={outputs} platforms={platforms} />
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <span className="font-medium">Gemini AI</span>
            {' · '}
            Built with{' '}
            <span className="font-medium">Next.js</span>
          </p>
          <p className="mt-2">
            © 2025 ContentForge. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
