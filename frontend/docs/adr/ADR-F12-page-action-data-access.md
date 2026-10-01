# ADR-F12: Page에서 serverApiGet 직접 호출 금지
**결정**: Page(Server Component)에서 `serverApiGet`을 직접 호출하지 않고, 반드시 Action을 통해 데이터를 조회한다.

**이유**:

- ADR-F04의 `Page → Action → Service → lib/server/api` 계층 원칙 위반
- Page가 API 엔드포인트 URL을 직접 알면 안 됨 — Service 계층의 추상화가 무의미해짐
- Action을 거치지 않으면 인증(`requireAuth`) 검증이 누락될 위험
- `serverApiGet` 직접 호출 시 에러 핸들링이 try/catch + console.error로 산발적 → Action의 `ActionResult` 패턴으로 통일

**적용 사례**:

- `transactions/page.tsx`: `serverApiGet("/families")` → `getSelectedFamilyAction()` + `getFamilyCategoriesAction()`
- `categories/page.tsx`: `serverApiGet("/families/.../categories")` → `getFamilyCategoriesAction()`

**redirect 책임**: Action이 아닌 Page에서 결과를 보고 판단한다. Action은 `ActionResult`를 반환하는 순수 controller 역할만 담당하고, 동일 Action을 사용하는 다른 호출처(Client Component 등)에 영향을 주지 않기 위함.

---


