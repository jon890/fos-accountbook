import Link from "next/link";
import { CoupleAvatars } from "@/components/dashboard/CoupleAvatars";
import { MiniDonut, MiniBars } from "@/components/landing/MiniStats";

// Static demo members for landing page illustration
const DEMO_MEMBERS = [
  { uuid: "demo-1", name: "남편" },
  { uuid: "demo-2", name: "아내" },
];

// ─────────────────────────────────────────────────────────────
// FeatureCard
// ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  badge: React.ReactNode;
  title: string;
  sub: string;
}

function FeatureCard({ badge, title, sub }: FeatureCardProps) {
  return (
    <div className="bg-bg-elev border border-border rounded-2xl p-[18px] flex items-center gap-4 shadow-sm">
      <div className="w-[72px] h-[72px] bg-bg-muted rounded-[14px] flex items-center justify-center shrink-0">
        {badge}
      </div>
      <div className="flex-1">
        <div className="text-[14.5px] font-bold tracking-[-0.015em] text-fg">{title}</div>
        <div className="text-xs text-fg-muted mt-1 leading-[1.5]">{sub}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LandingPage
// ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div
      className="min-h-screen text-fg hero-fade"
    >
      {/* Top bar */}
      <div className="px-5 pt-[14px] flex items-center justify-between md:px-14 md:pt-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 text-brand-fg flex items-center justify-center font-extrabold text-[13px] tracking-[-0.04em] md:w-8 md:h-8 md:text-[15px]">
            f
          </div>
          <span className="text-[14.5px] font-bold tracking-[-0.015em] text-brand-700 md:text-base">
            fos-accountbook
          </span>
        </div>
        <Link
          href="/auth/signin"
          className="text-[13px] font-semibold text-fg-muted hover:text-fg transition-colors"
        >
          로그인
        </Link>
      </div>

      {/* Hero */}
      <div className="px-5 pt-12 pb-9 md:px-14 md:pt-16 md:pb-14">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-full bg-bg-elev border border-border text-[11.5px] font-semibold text-brand-700 mb-[18px]">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          부부를 위한 가계부
        </div>

        <h1 className="text-[36px] font-extrabold tracking-[-0.035em] leading-[1.15] text-fg m-0 md:text-[56px] md:leading-[1.08]">
          가족과 함께<br />
          <span className="md:text-brand-700">쓰는 가계부</span>
        </h1>

        <p className="text-[15px] text-fg-muted mt-[14px] leading-[1.55] font-medium max-w-[300px] md:text-[17px] md:mt-5 md:max-w-[460px]">
          부부가 같이 입력하고,<br className="md:hidden" /> 한눈에 본다.
        </p>

        {/* CTA */}
        <div className="mt-[26px] md:mt-8 flex flex-col items-start gap-3 md:flex-row">
          <Link
            href="/auth/signin"
            className="w-full md:w-auto h-[54px] md:h-14 px-7 rounded-[13px] bg-brand-500 text-brand-fg flex items-center justify-center gap-2 text-[15.5px] font-bold [box-shadow:var(--shadow-hero-cta)]"
          >
            지금 시작하기
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="mt-2.5 text-xs text-fg-subtle font-medium text-center md:text-left">
          Google · Naver 로 5초 만에 시작
        </div>
      </div>

      {/* Features */}
      <div className="px-5 pb-6 flex flex-col gap-3 md:px-14 md:pb-16 md:grid md:grid-cols-3 md:gap-[18px]">
        <FeatureCard
          badge={<CoupleAvatars members={DEMO_MEMBERS} />}
          title="부부가 같이 입력해요"
          sub="누가 어디서 얼마 썼는지 실시간으로 공유돼요."
        />
        <FeatureCard
          badge={<MiniDonut size={56} />}
          title="어디에 썼는지 한눈에"
          sub="카테고리별 지출 분포를 도넛 차트로 확인해요."
        />
        <FeatureCard
          badge={<MiniBars w={84} h={42} />}
          title="추세까지 한 화면에"
          sub="이번 달 vs 지난 6개월, 흐름을 한눈에 봐요."
        />
      </div>

      {/* Bottom CTA section */}
      <div
        className="0 md:mx-14 md:mb-9 md:px-14 md:py-[52px] md:rounded-3xl md:flex md:items-center md:justify-between md:gap-8"
      >
        <div>
          <div className="text-[19px] font-bold tracking-[-0.02em] leading-[1.3] md:text-[32px] md:font-extrabold md:tracking-[-0.028em] md:leading-[1.2]">
            지금 무료로<br className="md:hidden" /> 시작하기
          </div>
          <div className="text-[12.5px] opacity-90 mt-2 font-medium md:text-[15px]">
            Google · Naver 로 5초 만에 시작
          </div>
        </div>
        <Link
          href="/auth/signin"
          className="mt-[18px] md:mt-0 h-[46px] md:h-14 px-6 md:px-9 rounded-[11px] md:rounded-[13px] bg-white text-brand-700 flex items-center justify-center gap-1.5 text-sm font-bold md:text-[15px] shrink-0 [box-shadow:var(--shadow-cta-white)]"
        >
          시작하기
          <ArrowRightIcon />
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 pt-[18px] pb-8 border-t border-border mt-2 text-center md:px-14 md:py-6 md:flex md:items-center md:justify-between md:text-left">
        <div className="text-[11px] text-fg-subtle font-medium">
          © {new Date().getFullYear()} fos-accountbook
        </div>
        <div className="mt-2 flex gap-4 justify-center md:mt-0 md:gap-[22px]">
          <span className="text-[11px] text-fg-muted font-medium">이용약관</span>
          <span className="text-[11px] text-fg-muted font-medium">개인정보처리방침</span>
        </div>
      </div>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
