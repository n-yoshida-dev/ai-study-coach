import { act, render, screen } from '@testing-library/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { supabase } from './lib/supabase'
import { fetchStudyRecords } from './lib/studyRecords'
import type { StudyRecord } from './types/studyRecord'

// App のテストはログイン状態による画面の切り替えだけを対象にする。
// 学習記録の登録・編集・削除は StudyRecordSection.test.tsx で検証する
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// ログイン済み画面（StudyRecordSection）が DB を読みに行くので、その窓口も偽物にする
vi.mock('./lib/studyRecords', () => ({
  fetchStudyRecords: vi.fn(),
  insertStudyRecord: vi.fn(),
  updateStudyRecord: vi.fn(),
  deleteStudyRecord: vi.fn(),
}))

const getSession = vi.mocked(supabase.auth.getSession)
const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)
const fetchStudyRecordsMock = vi.mocked(fetchStudyRecords)

const session = {
  user: { id: 'user-1', email: 'learner@example.com' },
} as Session

const savedRecord: StudyRecord = {
  id: 'record-1',
  studyDate: '2026-07-12',
  category: 'React',
  durationMinutes: 60,
  note: '',
  createdAt: '2026-07-12T10:00:00.000Z',
  updatedAt: '2026-07-12T10:00:00.000Z',
}

let notifyAuthChange: (event: AuthChangeEvent, session: Session | null) => void

const GUIDE_HEADING = 'ログインが必要です'
const FORM_NAME = '学習記録を登録'
const LIST_HEADING = '学習記録一覧'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    fetchStudyRecordsMock.mockResolvedValue([])
    onAuthStateChange.mockImplementation((callback) => {
      notifyAuthChange = callback
      return {
        data: {
          subscription: { id: 'test', callback, unsubscribe: vi.fn() },
        },
      }
    })
  })

  it('アプリ名と説明を表示する', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'AI Study Coach' }),
    ).toBeInTheDocument()
    expect(screen.getByText('学習記録を管理するアプリ')).toBeInTheDocument()
    await screen.findByRole('heading', { name: GUIDE_HEADING })
  })

  it('セッション確認中は案内もフォームも表示しない', () => {
    // 解決しない Promise を返し、確認中の状態を固定する
    getSession.mockReturnValue(new Promise(() => {}))

    render(<App />)

    expect(screen.getByText('ログイン状態を確認しています')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: GUIDE_HEADING }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('form', { name: FORM_NAME }),
    ).not.toBeInTheDocument()
  })

  it('未ログインなら案内を表示し、フォームと一覧を表示しない', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: GUIDE_HEADING }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('form', { name: FORM_NAME }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: LIST_HEADING }),
    ).not.toBeInTheDocument()
  })

  it('ログイン済みならフォームと一覧を表示し、案内を表示しない', async () => {
    getSession.mockResolvedValue({ data: { session }, error: null })

    render(<App />)

    expect(
      await screen.findByRole('form', { name: FORM_NAME }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: LIST_HEADING }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: GUIDE_HEADING }),
    ).not.toBeInTheDocument()
  })

  it('ログアウトすると学習記録が画面から消え、再ログインすると DB から読み直す', async () => {
    getSession.mockResolvedValue({ data: { session }, error: null })
    fetchStudyRecordsMock.mockResolvedValue([savedRecord])

    render(<App />)
    expect(await screen.findByRole('listitem')).toBeInTheDocument()
    expect(fetchStudyRecordsMock).toHaveBeenCalledTimes(1)

    act(() => notifyAuthChange('SIGNED_OUT', null))

    expect(
      screen.getByRole('heading', { name: GUIDE_HEADING }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()

    act(() => notifyAuthChange('SIGNED_IN', session))

    expect(screen.getByRole('form', { name: FORM_NAME })).toBeInTheDocument()
    expect(await screen.findByRole('listitem')).toBeInTheDocument()
    expect(fetchStudyRecordsMock).toHaveBeenCalledTimes(2)
  })
})
