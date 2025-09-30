-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "uuid" UUID NOT NULL,
    "internal_id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."families" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_members" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "family_uuid" UUID NOT NULL,
    "user_uuid" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "family_uuid" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    "icon" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "family_uuid" UUID NOT NULL,
    "category_uuid" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitations" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "family_uuid" UUID NOT NULL,
    "created_by_uuid" UUID NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "used_by_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "public"."users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_internal_id_key" ON "public"."users"("internal_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "families_uuid_key" ON "public"."families"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_uuid_key" ON "public"."family_members"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_family_uuid_user_uuid_key" ON "public"."family_members"("family_uuid", "user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "categories_uuid_key" ON "public"."categories"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_uuid_key" ON "public"."expenses"("uuid");

-- CreateIndex
CREATE INDEX "expenses_family_uuid_date_idx" ON "public"."expenses"("family_uuid", "date");

-- CreateIndex
CREATE INDEX "expenses_category_uuid_idx" ON "public"."expenses"("category_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_uuid_key" ON "public"."invitations"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "public"."invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "public"."invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_family_uuid_idx" ON "public"."invitations"("family_uuid");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_family_uuid_fkey" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_family_uuid_fkey" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_category_uuid_fkey" FOREIGN KEY ("category_uuid") REFERENCES "public"."categories"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_family_uuid_fkey" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
