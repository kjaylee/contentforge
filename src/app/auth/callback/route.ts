import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 사용자 프로필 생성/업데이트
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // users 테이블에 upsert
        await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
          }, {
            onConflict: 'id',
          });
          
        // subscriptions 테이블에 기본 레코드 생성 (없으면)
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            status: 'inactive',
            tier: 'free',
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: true,
          });
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 오류 발생 시 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=auth`);
}
