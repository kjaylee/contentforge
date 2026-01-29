# 🔥 ContentForge

> 블로그 하나로 SNS 10개 정복

AI 콘텐츠 리퍼포저 SaaS. 블로그 URL 하나를 입력하면 트위터, 링크드인, 인스타그램, 페이스북, 스레드에 최적화된 콘텐츠를 30초 만에 생성합니다.

## ✨ 기능

- 📝 **URL 크롤링**: 블로그 URL 붙여넣기로 자동 추출
- 🔄 **AI 변환**: Gemini Pro로 플랫폼별 최적화
- 🌐 **5개 플랫폼**: Twitter/X, LinkedIn, Instagram, Facebook, Threads
- 📋 **원클릭 복사**: 생성된 콘텐츠 바로 복사

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth + Database)
- **AI**: Gemini Pro API
- **Deploy**: Vercel

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📊 가격

| 티어 | 가격 | 포함 |
|------|------|------|
| Free | $0 | 월 5회, 3개 플랫폼 |
| Creator | $19/월 | 월 100회, 모든 플랫폼 |
| Pro | $49/월 | 무제한, API |

## 📁 프로젝트 구조

```
contentforge/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # UI 컴포넌트
│   └── lib/           # 유틸리티
├── supabase/
│   └── schema.sql     # DB 스키마
└── public/            # 정적 파일
```

## 📜 라이센스

MIT License

---

*빠르게 출시하고, 빠르게 배우자* 🚀
