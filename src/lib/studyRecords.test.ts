import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from './supabase'
import {
  deleteStudyRecord,
  fetchStudyRecords,
  insertStudyRecord,
  updateStudyRecord,
} from './studyRecords'
import type { Tables } from '../types/database.types'

// このテストは「カラム名の変換」と「Supabase にどんな命令を出すか」だけを検証する。
// 実際の通信と RLS は偽物なので、ここでは保証されない
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const from = vi.mocked(supabase.from)

type QueryResult = {
  data: unknown
  error: { message: string } | null
}

// supabase.from(...).select().order()... のようなメソッドチェーンの偽物。
// どのメソッドを呼んでも自分自身を返し、await されたときに result を返す
function mockQuery(result: QueryResult) {
  const query: Record<string, unknown> = {}

  for (const method of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'order',
    'single',
  ]) {
    query[method] = vi.fn(() => query)
  }

  query.then = (resolve: (value: QueryResult) => void) => resolve(result)

  from.mockReturnValue(query as never)

  return query as Record<string, ReturnType<typeof vi.fn>>
}

const row: Tables<'study_records'> = {
  id: 'record-1',
  user_id: 'user-1',
  study_date: '2026-07-12',
  category: 'React',
  duration_minutes: 60,
  note: 'useStateを学習した',
  created_at: '2026-07-12T10:00:00.000Z',
  updated_at: '2026-07-12T10:00:00.000Z',
}

const input = {
  studyDate: '2026-07-12',
  category: 'React',
  durationMinutes: 60,
  note: 'useStateを学習した',
}

describe('studyRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('取得した行を camelCase の学習記録へ変換し、新しい順を DB に指示する', async () => {
    const query = mockQuery({ data: [row], error: null })

    const records = await fetchStudyRecords()

    expect(from).toHaveBeenCalledWith('study_records')
    expect(query.order).toHaveBeenNthCalledWith(1, 'study_date', {
      ascending: false,
    })
    expect(query.order).toHaveBeenNthCalledWith(2, 'created_at', {
      ascending: false,
    })
    expect(records).toEqual([
      {
        id: 'record-1',
        studyDate: '2026-07-12',
        category: 'React',
        durationMinutes: 60,
        note: 'useStateを学習した',
        createdAt: '2026-07-12T10:00:00.000Z',
        updatedAt: '2026-07-12T10:00:00.000Z',
      },
    ])
  })

  it('登録では user_id と snake_case のカラムを送り、DB が採番した行を返す', async () => {
    const query = mockQuery({ data: row, error: null })

    const record = await insertStudyRecord('user-1', input)

    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      study_date: '2026-07-12',
      category: 'React',
      duration_minutes: 60,
      note: 'useStateを学習した',
    })
    expect(query.single).toHaveBeenCalled()
    expect(record.id).toBe('record-1')
    expect(record.createdAt).toBe('2026-07-12T10:00:00.000Z')
  })

  it('更新では id で対象を絞り、更新後の行を返す', async () => {
    const query = mockQuery({
      data: { ...row, category: 'TypeScript' },
      error: null,
    })

    const record = await updateStudyRecord('record-1', {
      ...input,
      category: 'TypeScript',
    })

    expect(query.update).toHaveBeenCalledWith({
      study_date: '2026-07-12',
      category: 'TypeScript',
      duration_minutes: 60,
      note: 'useStateを学習した',
    })
    expect(query.eq).toHaveBeenCalledWith('id', 'record-1')
    expect(record.category).toBe('TypeScript')
  })

  it('削除では id で対象を絞る', async () => {
    const query = mockQuery({ data: null, error: null })

    await deleteStudyRecord('record-1')

    expect(query.delete).toHaveBeenCalled()
    expect(query.eq).toHaveBeenCalledWith('id', 'record-1')
  })

  it('Supabase がエラーを返したら例外にする', async () => {
    mockQuery({ data: null, error: { message: '接続できません' } })

    await expect(fetchStudyRecords()).rejects.toThrow('接続できません')
  })
})
