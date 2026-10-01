export type CategoryToneKey =
  | "food"
  | "cafe"
  | "transit"
  | "telecom"
  | "home"
  | "shopping"
  | "health"
  | "leisure"
  | "education"
  | "etc";

export interface CategoryTone {
  bg: string;
  fg: string;
}

// 값은 globals.css 의 --color-cat-*-{bg|fg} 토큰이 소유한다. 다크 값도 그쪽에 있다 (ADR-F38).
const TONE_MAP: Record<CategoryToneKey, CategoryTone> = {
  food: { bg: "var(--color-cat-food-bg)", fg: "var(--color-cat-food-fg)" },
  cafe: { bg: "var(--color-cat-cafe-bg)", fg: "var(--color-cat-cafe-fg)" },
  transit: { bg: "var(--color-cat-transit-bg)", fg: "var(--color-cat-transit-fg)" },
  telecom: { bg: "var(--color-cat-telecom-bg)", fg: "var(--color-cat-telecom-fg)" },
  home: { bg: "var(--color-cat-home-bg)", fg: "var(--color-cat-home-fg)" },
  shopping: { bg: "var(--color-cat-shopping-bg)", fg: "var(--color-cat-shopping-fg)" },
  health: { bg: "var(--color-cat-health-bg)", fg: "var(--color-cat-health-fg)" },
  leisure: { bg: "var(--color-cat-leisure-bg)", fg: "var(--color-cat-leisure-fg)" },
  education: { bg: "var(--color-cat-education-bg)", fg: "var(--color-cat-education-fg)" },
  etc: { bg: "var(--color-cat-etc-bg)", fg: "var(--color-cat-etc-fg)" },
};

const NAME_TO_KEY: Record<string, CategoryToneKey> = {
  // food
  식비: "food", 음식: "food", 식료품: "food", 외식: "food",
  // cafe
  카페: "cafe", 커피: "cafe", 음료: "cafe",
  // transit
  교통: "transit", 대중교통: "transit", 주유: "transit", 자동차: "transit",
  // telecom
  통신: "telecom", 핸드폰: "telecom", 인터넷: "telecom", 휴대폰: "telecom",
  // home
  주거: "home", 주택: "home", 월세: "home", 관리비: "home", 공과금: "home",
  // shopping
  쇼핑: "shopping", 의류: "shopping", 패션: "shopping",
  // health
  의료: "health", 건강: "health", 병원: "health", 약국: "health",
  // leisure
  여가: "leisure", 오락: "leisure", 취미: "leisure", 구독: "leisure",
  // education
  교육: "education", 학원: "education", 도서: "education",
  // etc
  기타: "etc",
};

export function getCategoryToneKey(name: string): CategoryToneKey {
  return NAME_TO_KEY[name.trim()] ?? "etc";
}

export function getCategoryTone(name: string): CategoryTone {
  return TONE_MAP[getCategoryToneKey(name)];
}

export function getCategoryToneStyle(name: string): { background: string; color: string } {
  const tone = getCategoryTone(name);
  return { background: tone.bg, color: tone.fg };
}
