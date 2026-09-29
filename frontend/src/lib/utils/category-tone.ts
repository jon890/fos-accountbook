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

const TONE_MAP: Record<CategoryToneKey, CategoryTone> = {
  food:      { bg: "oklch(0.945 0.045  35)", fg: "oklch(0.560 0.140  35)" },
  cafe:      { bg: "oklch(0.945 0.045  60)", fg: "oklch(0.520 0.110  60)" },
  transit:   { bg: "oklch(0.945 0.045 230)", fg: "oklch(0.540 0.130 230)" },
  telecom:   { bg: "oklch(0.945 0.045 280)", fg: "oklch(0.540 0.130 280)" },
  home:      { bg: "oklch(0.945 0.045 188)", fg: "oklch(0.510 0.110 188)" },
  shopping:  { bg: "oklch(0.945 0.045 330)", fg: "oklch(0.560 0.140 330)" },
  health:    { bg: "oklch(0.945 0.045 152)", fg: "oklch(0.520 0.120 152)" },
  leisure:   { bg: "oklch(0.945 0.045 105)", fg: "oklch(0.520 0.120 105)" },
  education: { bg: "oklch(0.945 0.045 250)", fg: "oklch(0.540 0.130 250)" },
  etc:       { bg: "oklch(0.945 0.005 230)", fg: "oklch(0.510 0.015 230)" },
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
