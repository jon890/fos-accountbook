import { createServer } from "node:http";
import { BACKEND_PORT, FAMILY_UUID } from "./settings.ts";

const createdAt = "2026-01-01T00:00:00.000Z";
const unhandledRequests = [];

const family = {
  uuid: FAMILY_UUID,
  name: "브라우저 테스트 가족",
  monthlyBudget: 3000000,
  createdAt,
  updatedAt: createdAt,
  memberCount: 2,
  expenseCount: 12,
  categoryCount: 3,
};

const categories = [
  {
    uuid: "33333333-3333-3333-3333-333333333331",
    familyUuid: FAMILY_UUID,
    name: "식비",
    icon: "utensils",
    color: "oklch(0.560 0.140 35)",
    createdAt,
    updatedAt: createdAt,
  },
  {
    uuid: "33333333-3333-3333-3333-333333333332",
    familyUuid: FAMILY_UUID,
    name: "교통",
    icon: "bus",
    color: "oklch(0.540 0.130 230)",
    createdAt,
    updatedAt: createdAt,
  },
  {
    uuid: "33333333-3333-3333-3333-333333333333",
    familyUuid: FAMILY_UUID,
    name: "생활",
    icon: "house",
    color: "oklch(0.510 0.110 188)",
    createdAt,
    updatedAt: createdAt,
  },
];

const notifications = [
  {
    notificationUuid: "44444444-4444-4444-4444-444444444441",
    familyUuid: FAMILY_UUID,
    userUuid: null,
    type: "BUDGET_80_EXCEEDED",
    typeDisplayName: "예산 경고",
    title: "식비 예산이 80%를 넘었습니다",
    message: "이번 달 식비를 확인해 주세요.",
    referenceUuid: null,
    referenceType: null,
    yearMonth: "2026-01",
    isRead: false,
    createdAt,
  },
  {
    notificationUuid: "44444444-4444-4444-4444-444444444442",
    familyUuid: FAMILY_UUID,
    userUuid: null,
    type: "BUDGET_50_EXCEEDED",
    typeDisplayName: "예산 안내",
    title: "교통비 예산 사용 현황",
    message: "교통비 예산의 절반을 사용했습니다.",
    referenceUuid: null,
    referenceType: null,
    yearMonth: "2026-01",
    isRead: true,
    createdAt,
  },
];

const invitationToken = "55555555-5555-4555-8555-555555555555";

const invitation = {
  uuid: "66666666-6666-4666-8666-666666666666",
  familyUuid: FAMILY_UUID,
  familyName: family.name,
  token: invitationToken,
  status: "PENDING",
  expiresAt: "2099-01-02T00:00:00.000Z",
  createdAt,
  isExpired: false,
  isUsed: false,
  inviter: {
    name: "초대자",
    avatarUrl: null,
  },
  memberCount: family.memberCount,
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  const method = request.method ?? "GET";
  const pathname = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;

  if (method === "POST" && pathname === "/__test/reset") {
    unhandledRequests.length = 0;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "GET" && pathname === "/__test/unhandled") {
    sendJson(response, 200, unhandledRequests);
    return;
  }
  if (method === "GET" && pathname === "/api/v1/families") {
    sendJson(response, 200, { success: true, data: [family] });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/categories`) {
    sendJson(response, 200, { success: true, data: categories });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/notifications/unread-count`) {
    sendJson(response, 200, { success: true, data: { unreadCount: 1 } });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/notifications`) {
    sendJson(response, 200, { success: true, data: { notifications, unreadCount: 1, totalCount: notifications.length } });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/invitations/token/${invitationToken}`) {
    sendJson(response, 200, { data: invitation });
    return;
  }

  const requestName = `${method} ${pathname}`;
  unhandledRequests.push(requestName);
  sendJson(response, 404, { success: false, message: `Unsupported test backend path: ${requestName}` });
});

server.listen(BACKEND_PORT, "127.0.0.1", () => {
  console.log(`Fake backend listening on ${BACKEND_PORT}`);
});
