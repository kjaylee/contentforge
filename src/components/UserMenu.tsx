'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogIn, LogOut, Crown, Zap, User, Settings } from 'lucide-react';

export function UserMenu() {
  const { user, usage, isLoading, signInWithGoogle, signOut } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!user || !usage?.isLoggedIn) {
    return (
      <Button
        onClick={signInWithGoogle}
        variant="outline"
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        Google로 로그인
      </Button>
    );
  }

  const isPro = usage.tier === 'pro';

  return (
    <div className="flex items-center gap-3">
      {/* 사용량 표시 */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
        <Zap className="h-4 w-4" />
        {isPro ? (
          <span>무제한</span>
        ) : (
          <span>{usage.remaining}/{usage.dailyLimit} 남음</span>
        )}
      </div>

      {/* Pro 배지 또는 업그레이드 버튼 */}
      {isPro ? (
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 gap-1">
          <Crown className="h-3 w-3" />
          Pro
        </Badge>
      ) : (
        <Button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 gap-1"
        >
          <Crown className="h-4 w-4" />
          업그레이드
        </Button>
      )}

      {/* 사용자 메뉴 */}
      <div className="relative group">
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
          {usage.avatarUrl ? (
            <img
              src={usage.avatarUrl}
              alt={usage.name || 'User'}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          )}
        </button>

        {/* 드롭다운 메뉴 */}
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-3 border-b">
            <p className="font-medium text-sm truncate">{usage.name || '사용자'}</p>
            <p className="text-xs text-gray-500 truncate">{usage.email}</p>
          </div>
          
          <div className="p-2">
            {/* 모바일 사용량 표시 */}
            <div className="sm:hidden px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {isPro ? '무제한' : `오늘 ${usage.remaining}/${usage.dailyLimit} 남음`}
            </div>

            {isPro && (
              <button
                onClick={handleManageSubscription}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-md flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                구독 관리
              </button>
            )}
            
            <button
              onClick={signOut}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-md flex items-center gap-2 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
