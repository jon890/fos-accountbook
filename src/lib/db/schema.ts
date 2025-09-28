import { pgTable, bigserial, uuid, varchar, timestamp, text, decimal, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Families table
export const families = pgTable('families', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uuidIdx: uniqueIndex('families_uuid_idx').on(table.uuid),
}))

// Family members table
export const familyMembers = pgTable('family_members', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  familyId: bigserial('family_id', { mode: 'number' }).references(() => families.id, { onDelete: 'cascade' }).notNull(),
  familyUuid: uuid('family_uuid').references(() => families.uuid, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(), // NextAuth user ID
  role: varchar('role', { length: 20, enum: ['admin', 'member'] }).default('member').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uuidIdx: uniqueIndex('family_members_uuid_idx').on(table.uuid),
  familyIdIdx: index('family_members_family_id_idx').on(table.familyId),
  familyUuidIdx: index('family_members_family_uuid_idx').on(table.familyUuid),
  userIdIdx: index('family_members_user_id_idx').on(table.userId),
  uniqueFamilyUser: uniqueIndex('family_members_family_user_unique').on(table.familyId, table.userId),
}))

// Categories table
export const categories = pgTable('categories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  familyId: bigserial('family_id', { mode: 'number' }).references(() => families.id, { onDelete: 'cascade' }).notNull(),
  familyUuid: uuid('family_uuid').references(() => families.uuid, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6').notNull(), // hex color
  icon: varchar('icon', { length: 50 }).default('circle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uuidIdx: uniqueIndex('categories_uuid_idx').on(table.uuid),
  familyIdIdx: index('categories_family_id_idx').on(table.familyId),
  familyUuidIdx: index('categories_family_uuid_idx').on(table.familyUuid),
}))

// Expenses table
export const expenses = pgTable('expenses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  familyId: bigserial('family_id', { mode: 'number' }).references(() => families.id, { onDelete: 'cascade' }).notNull(),
  familyUuid: uuid('family_uuid').references(() => families.uuid, { onDelete: 'cascade' }).notNull(),
  categoryId: bigserial('category_id', { mode: 'number' }).references(() => categories.id, { onDelete: 'set null' }),
  categoryUuid: uuid('category_uuid').references(() => categories.uuid, { onDelete: 'set null' }),
  userId: text('user_id').notNull(), // NextAuth user ID
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  date: date('date').defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uuidIdx: uniqueIndex('expenses_uuid_idx').on(table.uuid),
  familyIdIdx: index('expenses_family_id_idx').on(table.familyId),
  familyUuidIdx: index('expenses_family_uuid_idx').on(table.familyUuid),
  categoryIdIdx: index('expenses_category_id_idx').on(table.categoryId),
  categoryUuidIdx: index('expenses_category_uuid_idx').on(table.categoryUuid),
  userIdIdx: index('expenses_user_id_idx').on(table.userId),
  dateIdx: index('expenses_date_idx').on(table.date),
}))

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  members: many(familyMembers),
  categories: many(categories),
  expenses: many(expenses),
}))

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  expenses: many(expenses),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  family: one(families, {
    fields: [expenses.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}))

// Export types
export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert
export type FamilyMember = typeof familyMembers.$inferSelect
export type NewFamilyMember = typeof familyMembers.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
