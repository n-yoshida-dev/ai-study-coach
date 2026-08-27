import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY が設定されていません。.env.local を確認してください',
  )
}

// Database 型（npm run gen:types で生成）を渡すと、
// .from('study_records') の select / insert がテーブルのカラム名と型を知った状態になる
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
