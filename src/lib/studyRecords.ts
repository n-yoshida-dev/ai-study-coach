import { supabase } from './supabase'
import type { Tables, TablesInsert } from '../types/database.types'
import type { StudyRecord, StudyRecordInput } from '../types/studyRecord'

// Supabase の study_records テーブルを読み書きする窓口。
// コンポーネントは supabase.from() を直接触らず、この関数だけを使う。
// DB のカラム名（snake_case）とアプリの項目名（camelCase）の変換はここに閉じ込める

type StudyRecordRow = Tables<'study_records'>

function toStudyRecord(row: StudyRecordRow): StudyRecord {
  return {
    id: row.id,
    studyDate: row.study_date,
    category: row.category,
    durationMinutes: row.duration_minutes,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toColumns(input: StudyRecordInput) {
  return {
    study_date: input.studyDate,
    category: input.category,
    duration_minutes: input.durationMinutes,
    note: input.note,
  }
}

// 自分の記録だけが返る。絞り込み条件は書かず、RLS（user_id = auth.uid()）に任せる
export async function fetchStudyRecords(): Promise<StudyRecord[]> {
  const { data, error } = await supabase
    .from('study_records')
    .select()
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data.map(toStudyRecord)
}

// id / created_at / updated_at は DB が採番するので送らない。
// .select().single() を付けると、採番済みの行がそのまま返ってくる
export async function insertStudyRecord(
  userId: string,
  input: StudyRecordInput,
): Promise<StudyRecord> {
  const row: TablesInsert<'study_records'> = {
    user_id: userId,
    ...toColumns(input),
  }

  const { data, error } = await supabase
    .from('study_records')
    .insert(row)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toStudyRecord(data)
}

// updated_at は DB のトリガーが更新するので送らない
export async function updateStudyRecord(
  id: string,
  input: StudyRecordInput,
): Promise<StudyRecord> {
  const { data, error } = await supabase
    .from('study_records')
    .update(toColumns(input))
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toStudyRecord(data)
}

export async function deleteStudyRecord(id: string): Promise<void> {
  const { error } = await supabase.from('study_records').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
