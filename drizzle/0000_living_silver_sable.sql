CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"family_id" bigserial NOT NULL,
	"family_uuid" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"icon" varchar(50) DEFAULT 'circle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"family_id" bigserial NOT NULL,
	"family_uuid" uuid NOT NULL,
	"category_id" bigserial NOT NULL,
	"category_uuid" uuid,
	"user_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "families_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"family_id" bigserial NOT NULL,
	"family_uuid" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_members_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_family_uuid_families_uuid_fk" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_family_uuid_families_uuid_fk" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_uuid_categories_uuid_fk" FOREIGN KEY ("category_uuid") REFERENCES "public"."categories"("uuid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_uuid_families_uuid_fk" FOREIGN KEY ("family_uuid") REFERENCES "public"."families"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_uuid_idx" ON "categories" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "categories_family_id_idx" ON "categories" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "categories_family_uuid_idx" ON "categories" USING btree ("family_uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_uuid_idx" ON "expenses" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "expenses_family_id_idx" ON "expenses" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "expenses_family_uuid_idx" ON "expenses" USING btree ("family_uuid");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_category_uuid_idx" ON "expenses" USING btree ("category_uuid");--> statement-breakpoint
CREATE INDEX "expenses_user_id_idx" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "families_uuid_idx" ON "families" USING btree ("uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "family_members_uuid_idx" ON "family_members" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "family_members_family_id_idx" ON "family_members" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_members_family_uuid_idx" ON "family_members" USING btree ("family_uuid");--> statement-breakpoint
CREATE INDEX "family_members_user_id_idx" ON "family_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "family_members_family_user_unique" ON "family_members" USING btree ("family_id","user_id");