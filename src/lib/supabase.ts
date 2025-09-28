import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export types from Drizzle schema
export type {
  Family,
  NewFamily,
  FamilyMember,
  NewFamilyMember,
  Category,
  NewCategory,
  Expense,
  NewExpense,
} from './db/schema'
