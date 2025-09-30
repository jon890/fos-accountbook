import { PrismaClient } from "@prisma/client";
import { format } from "sql-formatter";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? [
          { level: "query", emit: "event" },
          { level: "error", emit: "stdout" },
          { level: "warn", emit: "stdout" },
        ]
      : [],
  });

  // 개발 환경에서만 쿼리 로깅
  if (process.env.NODE_ENV === "development") {
    prisma.$on("query", (e) => {
      // 필터링: commit, begin, deallocate 등 제외
      const skipQueries = [
        "BEGIN",
        "COMMIT",
        "ROLLBACK",
        "DEALLOCATE",
        "SET",
      ];

      const queryUpper = e.query.trim().toUpperCase();
      const shouldSkip = skipQueries.some((skip) => queryUpper.startsWith(skip));

      if (shouldSkip) {
        return;
      }

      // SQL 포맷팅
      let formattedQuery;
      try {
        formattedQuery = format(e.query, {
          language: "postgresql",
          tabWidth: 2,
          keywordCase: "upper",
          linesBetweenQueries: 2,
        });
      } catch {
        // 포맷팅 실패 시 원본 사용
        formattedQuery = e.query;
      }

      // 로그 출력
      console.log("\n📊 Prisma Query:");
      console.log("─".repeat(80));
      console.log(formattedQuery);
      
      // 파라미터 출력
      if (e.params && e.params !== "[]") {
        console.log("\n📌 Parameters:");
        try {
          const params = JSON.parse(e.params);
          if (Array.isArray(params) && params.length > 0) {
            params.forEach((param, index) => {
              console.log(`  $${index + 1}: ${JSON.stringify(param)}`);
            });
          }
        } catch {
          console.log(`  ${e.params}`);
        }
      }
      
      // 실행 시간 출력
      console.log(`\n⏱️  Duration: ${e.duration}ms`);
      console.log("─".repeat(80));
      console.log();
    });
  }

  return prisma;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}