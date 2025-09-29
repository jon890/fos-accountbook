-- CreateTable
CREATE TABLE "family_invites" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "family_uuid" UUID NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "family_invites_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "family_invites_uuid_key" ON "family_invites"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "family_invites_invite_code_key" ON "family_invites"("invite_code");

-- CreateIndex
CREATE INDEX "family_invites_invite_code_idx" ON "family_invites"("invite_code");

-- CreateIndex
CREATE INDEX "family_invites_family_uuid_idx" ON "family_invites"("family_uuid");

-- AddForeignKey
ALTER TABLE "family_invites" ADD CONSTRAINT "family_invites_family_uuid_fkey" FOREIGN KEY ("family_uuid") REFERENCES "families"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invites" ADD CONSTRAINT "family_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
