import { createServer } from "node:http";
import { BACKEND_PORT, FAMILY_UUID } from "./settings.ts";

const createdAt = "2026-01-01T00:00:00.000Z";
const unhandledRequests = [];
const createdTransactions = [];
const transactionRequestSizes = [];
let categoriesAreEmpty = false;
let transactionsAreEmpty = false;
let transactionTotalElements = null;
let categorySummaryIsEmpty = false;
let notificationsAreHeld = false;
let extraNotificationCount = 0;
let notificationHold;
let budgetIsConfigured = true;
const responseDelays = new Map();

const family = {
  uuid: FAMILY_UUID,
  name: "브라우저 테스트 가족",
  monthlyBudget: 3000000,
  createdAt,
  updatedAt: createdAt,
  memberCount: 2,
  expenseCount: 12,
  categoryCount: 4,
};

const categories = [
  {
    uuid: "33333333-3333-3333-3333-333333333331",
    familyUuid: FAMILY_UUID,
    type: "EXPENSE",
    name: "식비",
    icon: "🍽️",
    color: "oklch(0.560 0.140 35)",
    excludeFromBudget: false,
    createdAt,
    updatedAt: createdAt,
  },
  {
    uuid: "33333333-3333-3333-3333-333333333332",
    familyUuid: FAMILY_UUID,
    type: "EXPENSE",
    name: "교통",
    icon: "🚌",
    color: "oklch(0.540 0.130 230)",
    excludeFromBudget: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    uuid: "33333333-3333-3333-3333-333333333333",
    familyUuid: FAMILY_UUID,
    type: "EXPENSE",
    name: "생활",
    icon: "🏠",
    color: "oklch(0.510 0.110 188)",
    excludeFromBudget: false,
    createdAt,
    updatedAt: createdAt,
  },
  {
    uuid: "33333333-3333-3333-3333-333333333334",
    familyUuid: FAMILY_UUID,
    type: "INCOME",
    name: "급여",
    icon: "💰",
    color: "oklch(0.650 0.140 145)",
    excludeFromBudget: false,
    createdAt,
    updatedAt: createdAt,
  },
];

function getCategory(type, name) {
  const category = categories.find(
    (candidate) => candidate.type === type && candidate.name === name,
  );

  if (!category) {
    throw new Error(`Missing ${type} category fixture: ${name}`);
  }

  return category;
}

const foodExpenseCategory = getCategory("EXPENSE", "식비");
const livingExpenseCategory = getCategory("EXPENSE", "생활");
const salaryIncomeCategory = getCategory("INCOME", "급여");

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

const members = [
  {
    userUuid: "22222222-2222-2222-2222-222222222222",
    name: "민지",
    email: "minji@example.com",
    image: null,
    role: "OWNER",
    joinedAt: createdAt,
  },
];

const transactions = {
  expenses: [{
    uuid: "55555555-5555-5555-5555-555555555551",
    familyUuid: FAMILY_UUID,
    userUuid: members[0].userUuid,
    categoryUuid: foodExpenseCategory.uuid,
    category: null,
    amount: 12500,
    description: "점심 식사",
    date: "2026-10-01T12:30:00.000Z",
    excludeFromBudget: true,
    createdAt,
    updatedAt: createdAt,
  }, {
    uuid: "55555555-5555-5555-5555-555555555554",
    familyUuid: FAMILY_UUID,
    userUuid: members[0].userUuid,
    categoryUuid: categories[1].uuid,
    category: null,
    amount: 1400,
    description: "버스 요금",
    date: "2026-10-01T08:30:00.000Z",
    excludeFromBudget: false,
    createdAt,
    updatedAt: createdAt,
  }, {
    uuid: "55555555-5555-5555-5555-555555555555",
    familyUuid: FAMILY_UUID,
    userUuid: members[0].userUuid,
    categoryUuid: categories[2].uuid,
    category: null,
    amount: 2300,
    description: "세탁 세제",
    date: "2026-10-01T18:00:00.000Z",
    excludeFromBudget: false,
    createdAt,
    updatedAt: createdAt,
  }],
  incomes: [{
    uuid: "55555555-5555-5555-5555-555555555552",
    familyUuid: FAMILY_UUID,
    userUuid: members[0].userUuid,
    categoryUuid: salaryIncomeCategory.uuid,
    category: { ...salaryIncomeCategory, icon: "💳" },
    amount: 3000000,
    description: "10월 월급",
    date: "2026-10-01T09:00:00.000Z",
    createdAt,
    updatedAt: createdAt,
  }],
};

const recurringExpenses = [
  {
    uuid: "55555555-5555-5555-5555-555555555553",
    familyUuid: FAMILY_UUID,
    categoryUuid: livingExpenseCategory.uuid,
    category: { ...livingExpenseCategory, icon: "🏠" },
    name: "월세",
    amount: 850000,
    dayOfMonth: 25,
    status: "ACTIVE",
    generatedThisMonth: true,
    createdAt,
    updatedAt: createdAt,
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
  // 백엔드 InvitationResponse 의 원시형 boolean isExpired, isUsed 는 Jackson 이 expired, used 로 직렬화한다.
  expired: false,
  used: false,
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

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  if (method === "POST" && pathname === "/__test/reset") {
    unhandledRequests.length = 0;
    createdTransactions.length = 0;
    transactionRequestSizes.length = 0;
    categoriesAreEmpty = false;
    transactionsAreEmpty = false;
    transactionTotalElements = null;
    categorySummaryIsEmpty = false;
    budgetIsConfigured = true;
    responseDelays.clear();
    extraNotificationCount = 0;
    setNotificationsHeld(false);
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "GET" && pathname === "/__test/created-transactions") {
    sendJson(response, 200, createdTransactions);
    return;
  }
  if (method === "GET" && pathname === "/__test/transaction-request-sizes") {
    sendJson(response, 200, transactionRequestSizes);
    return;
  }
  if (method === "POST" && pathname === "/__test/categories") {
    const body = await readJson(request);
    if (typeof body?.empty !== "boolean") {
      sendJson(response, 400, { success: false, message: "Expected an empty boolean" });
      return;
    }
    categoriesAreEmpty = body.empty;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/transactions") {
    const body = await readJson(request);
    if (typeof body?.empty !== "boolean") {
      sendJson(response, 400, { success: false, message: "Expected an empty boolean" });
      return;
    }
    transactionsAreEmpty = body.empty;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/transactions-total") {
    const body = await readJson(request);
    if (!Number.isInteger(body?.totalElements) || body.totalElements < 0) {
      sendJson(response, 400, { success: false, message: "Expected a non-negative integer totalElements" });
      return;
    }
    transactionTotalElements = body.totalElements;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/category-summary") {
    const body = await readJson(request);
    if (typeof body?.empty !== "boolean") {
      sendJson(response, 400, { success: false, message: "Expected an empty boolean" });
      return;
    }
    categorySummaryIsEmpty = body.empty;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/budget") {
    const body = await readJson(request);
    if (typeof body?.configured !== "boolean") {
      sendJson(response, 400, { success: false, message: "Expected a configured boolean" });
      return;
    }
    budgetIsConfigured = body.configured;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/notifications-count") {
    const body = await readJson(request);
    if (!Number.isInteger(body?.extra) || body.extra < 0) {
      sendJson(response, 400, { success: false, message: "Expected a non-negative integer extra" });
      return;
    }
    extraNotificationCount = body.extra;
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/notifications-delay") {
    const body = await readJson(request);
    if (typeof body?.hold !== "boolean") {
      sendJson(response, 400, { success: false, message: "Expected a hold boolean" });
      return;
    }
    setNotificationsHeld(body.hold);
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "POST" && pathname === "/__test/delay") {
    const body = await readJson(request);
    const isApiPath = typeof body?.pathPrefix === "string"
      && body.pathPrefix.startsWith("/api/v1/");
    const isValidDelay = typeof body?.ms === "number"
      && Number.isFinite(body.ms)
      && body.ms >= 0;
    if (!isApiPath || !isValidDelay) {
      sendJson(response, 400, { success: false, message: "Expected an API pathPrefix and a non-negative ms" });
      return;
    }
    setResponseDelay(body.pathPrefix, body.ms);
    sendJson(response, 200, { success: true });
    return;
  }
  if (method === "GET" && pathname === "/__test/unhandled") {
    sendJson(response, 200, unhandledRequests);
    return;
  }
  await waitForResponseDelay(pathname);
  if (method === "POST" && pathname === `/api/v1/families/${FAMILY_UUID}/expenses`) {
    const body = await readJson(request);
    createdTransactions.push({ path: pathname, body });
    sendJson(response, 200, {
      success: true,
      data: {
        uuid: "55555555-5555-5555-5555-555555555556",
        familyUuid: FAMILY_UUID,
        userUuid: members[0].userUuid,
        categoryUuid: body?.categoryUuid,
        category: null,
        amount: body?.amount,
        description: body?.description ?? null,
        date: body?.date,
        excludeFromBudget: body?.excludeFromBudget ?? false,
        createdAt,
        updatedAt: createdAt,
      },
    });
    return;
  }
  if (method === "GET" && pathname === "/api/v1/families") {
    sendJson(response, 200, { success: true, data: [family] });
    return;
  }
  if (method === "GET" && pathname === "/api/v1/users/me/profile") {
    sendJson(response, 200, {
      success: true,
      data: {
        userUuid: members[0].userUuid,
        timezone: "Asia/Seoul",
        language: "ko",
        currency: "KRW",
        defaultFamilyUuid: FAMILY_UUID,
        createdAt,
        updatedAt: createdAt,
      },
    });
    return;
  }
  if (method === "GET" && pathname === "/api/v1/users/me/api-tokens") {
    sendJson(response, 200, { success: true, data: [] });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/categories`) {
    sendJson(response, 200, { success: true, data: categoriesAreEmpty ? [] : categories });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/members`) {
    sendJson(response, 200, { success: true, data: members });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/dashboard/daily-stats`) {
    sendJson(response, 200, {
      success: true,
      data: {
        year: 2026,
        month: 10,
        dailyStats: [{
          date: "2026-10-01",
          income: 3000000,
          expense: 16200,
          memberExpenses: [{ userUuid: members[0].userUuid, amount: 16200 }],
        }],
        totalIncome: 3000000,
        totalExpense: 16200,
        memberExpenseTotals: [{ userUuid: members[0].userUuid, amount: 16200 }],
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/budget-items`) {
    sendJson(response, 200, { success: true, data: [] });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/dashboard/budget-summary`) {
    sendJson(response, 200, {
      success: true,
      data: {
        year: 2026,
        month: 10,
        total: { spent: 166200, limit: family.monthlyBudget },
        living: { spent: 16200, limit: Math.max(family.monthlyBudget - 400000, 0) },
        allocationExceeded: family.monthlyBudget > 0 && 400000 > family.monthlyBudget,
        items: [{
          budgetItemUuid: "00000000-0000-4000-8000-0000000000b1",
          name: "용돈",
          limit: 400000,
          spent: 150000,
        }],
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/dashboard/stats/monthly`) {
    const budget = budgetIsConfigured ? family.monthlyBudget : 0;
    const monthlyExpense = budgetIsConfigured ? 16200 : 0;
    sendJson(response, 200, {
      success: true,
      data: {
        monthlyExpense,
        monthlyIncome: 3000000,
        remainingBudget: budget - monthlyExpense,
        familyMembers: family.memberCount,
        budget,
        year: 2026,
        month: 10,
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/dashboard/stats/category-breakdown`) {
    sendJson(response, 200, {
      success: true,
      data: {
        year: 2026,
        month: 10,
        totalExpense: 16200,
        items: [{
          categoryUuid: categories[0].uuid,
          name: categories[0].name,
          icon: "🍚",
          color: categories[0].color,
          totalAmount: 16200,
          percentage: 100,
          deltaPercent: null,
          previousAmount: null,
        }],
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/expenses`) {
    transactionRequestSizes.push(requestUrl.searchParams.get("size"));
    sendJson(response, 200, {
      success: true,
      data: {
        items: transactionsAreEmpty ? [] : transactions.expenses,
        totalElements: transactionsAreEmpty ? 0 : transactionTotalElements ?? transactions.expenses.length,
        totalPages: 1,
        currentPage: 0,
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/incomes`) {
    transactionRequestSizes.push(requestUrl.searchParams.get("size"));
    sendJson(response, 200, {
      success: true,
      data: {
        items: transactionsAreEmpty ? [] : transactions.incomes,
        totalElements: transactionsAreEmpty ? 0 : transactionTotalElements ?? transactions.incomes.length,
        totalPages: 1,
        currentPage: 0,
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/recurring-expenses`) {
    sendJson(response, 200, {
      success: true,
      data: { items: recurringExpenses, totalMonthlyAmount: 850000 },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/dashboard/expenses/by-category`) {
    sendJson(response, 200, {
      success: true,
      data: categorySummaryIsEmpty ? {
        totalExpense: 0,
        categoryStats: [],
      } : {
        totalExpense: 50100,
        categoryStats: [
          { categoryUuid: categories[0].uuid, categoryName: "식비", categoryIcon: "🍚", categoryColor: categories[0].color, totalAmount: 15000, count: 5, percentage: 30 },
          { categoryUuid: categories[1].uuid, categoryName: "교통", categoryIcon: "🚌", categoryColor: categories[1].color, totalAmount: 12500, count: 4, percentage: 25 },
          { categoryUuid: categories[2].uuid, categoryName: "생활", categoryIcon: "🏠", categoryColor: categories[2].color, totalAmount: 10000, count: 3, percentage: 20 },
          { categoryUuid: "33333333-3333-3333-3333-333333333337", categoryName: "카페", categoryIcon: "☕", categoryColor: "oklch(0.520 0.110 60)", totalAmount: 6000, count: 2, percentage: 12 },
          { categoryUuid: "33333333-3333-3333-3333-333333333335", categoryName: "쇼핑", categoryIcon: "🛍️", categoryColor: "oklch(0.560 0.140 330)", totalAmount: 4100, count: 2, percentage: 8 },
          { categoryUuid: "33333333-3333-3333-3333-333333333336", categoryName: "기타", categoryIcon: "📦", categoryColor: "oklch(0.510 0.015 230)", totalAmount: 2500, count: 1, percentage: 5 },
        ],
      },
    });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/notifications/unread-count`) {
    sendJson(response, 200, { success: true, data: { unreadCount: 1 } });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/families/${FAMILY_UUID}/notifications`) {
    await waitForNotifications();
    const items = [
      ...notifications,
      ...Array.from({ length: extraNotificationCount }, (_, index) => ({
        ...notifications[1],
        notificationUuid: `55555555-5555-5555-5555-${String(index).padStart(12, "0")}`,
        title: `추가 알림 ${index + 1}`,
      })),
    ];
    sendJson(response, 200, { success: true, data: { notifications: items, unreadCount: 1, totalCount: items.length } });
    return;
  }
  if (method === "GET" && pathname === `/api/v1/invitations/token/${invitationToken}`) {
    sendJson(response, 200, { success: true, data: invitation });
    return;
  }

  const requestName = `${method} ${pathname}`;
  unhandledRequests.push(requestName);
  sendJson(response, 404, { success: false, message: `Unsupported test backend path: ${requestName}` });
});

function setNotificationsHeld(hold) {
  notificationsAreHeld = hold;
  if (hold && !notificationHold) {
    let release;
    const promise = new Promise((resolve) => {
      release = resolve;
    });
    notificationHold = { promise, release };
  }
  if (!hold && notificationHold) {
    notificationHold.release();
    notificationHold = undefined;
  }
}

async function waitForNotifications() {
  if (!notificationsAreHeld) return;
  await notificationHold.promise;
}

function setResponseDelay(pathPrefix, ms) {
  if (ms === 0) {
    responseDelays.delete(pathPrefix);
    return;
  }
  responseDelays.set(pathPrefix, ms);
}

async function waitForResponseDelay(pathname) {
  const matchingDelays = [...responseDelays]
    .filter(([pathPrefix]) => pathname.startsWith(pathPrefix))
    .map(([, ms]) => ms);
  const delayMs = Math.max(0, ...matchingDelays);
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

server.listen(BACKEND_PORT, "127.0.0.1", () => {
  console.log(`Fake backend listening on ${BACKEND_PORT}`);
});
