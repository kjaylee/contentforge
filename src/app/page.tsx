'use client';

import { useState, useEffect } from 'react';
import { GenerateForm } from '@/components/GenerateForm';
import { ResultsContainer } from '@/components/ResultCard';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/components/AuthProvider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Platform, GenerationOutputs } from '@/types/database';

export default function Home() {
  const [outputs, setOutputs] = useState<GenerationOutputs | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const { refreshUsage } = useAuth();

  // URL 파라미터 체크 (결제 성공/취소)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setNotification({ type: 'success', message: 'Pro 구독이 활성화되었습니다! 🎉' });
      refreshUsage();
      // URL 파라미터 제거
      window.history.replaceState({}, '', '/');
    } else if (params.get('canceled') === 'true') {
      setNotification({ type: 'error', message: '결제가 취소되었습니다.' });
      window.history.replaceState({}, '', '/');
    }
  }, [refreshUsage]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleGenerate = (newOutputs: GenerationOutputs, newPlatforms: Platform[]) => {
    setOutputs(newOutputs);
    setPlatforms(newPlatforms);
    refreshUsage(); // 사용량 새로고침
    
    // 결과 영역으로 스크롤
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 알림 배너 */}
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ContentForge
            </h1>
            <Badge variant="outline" className="text-xs">Beta</Badge>
          </div>
          <UserMenu />
        </header>

        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            하나의 콘텐츠로<br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              모든 SNS를 정복하세요
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI가 각 플랫폼의 특성에 맞게 자동으로 재작성합니다.
          </p>
        </div>

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
            <div className="text-sm text-gray-500">일 5회 무료</div>
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

        {/* Pricing */}
        <Separator className="my-12" />
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">심플한 요금제</h3>
          <p className="text-gray-600">무료로 시작하고, 필요할 때 업그레이드하세요</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {/* Free */}
          <div className="border rounded-xl p-6 bg-white">
            <h4 className="text-xl font-bold mb-2">Free</h4>
            <div className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-gray-500">/월</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>✓ 일 5회 생성</li>
              <li>✓ 3개 플랫폼</li>
              <li>✓ 기본 지원</li>
            </ul>
            <div className="text-center text-gray-500 text-sm">현재 사용 중</div>
          </div>

          {/* Pro */}
          <div className="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-b from-purple-50 to-white relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">추천</Badge>
            <h4 className="text-xl font-bold mb-2">Pro</h4>
            <div className="text-3xl font-bold mb-4">$9<span className="text-lg font-normal text-gray-500">/월</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>✓ <strong>무제한</strong> 생성</li>
              <li>✓ 5개 플랫폼</li>
              <li>✓ 우선 지원</li>
              <li>✓ 히스토리 저장</li>
            </ul>
            <PricingUpgradeButton />
          </div>
        </div>

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

function PricingUpgradeButton() {
  const { usage, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!usage?.isLoggedIn) {
      signInWithGoogle();
      return;
    }

    if (usage.tier === 'pro') {
      // 이미 Pro면 포털로
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = !usage?.isLoggedIn
    ? '로그인하고 시작하기'
    : usage.tier === 'pro'
    ? '구독 관리'
    : 'Pro 시작하기';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
    >
      {isLoading ? '처리 중...' : buttonText}
    </button>
  );
}
