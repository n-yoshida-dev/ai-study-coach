import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudyRecordSection from './StudyRecordSection'
import {
  deleteStudyRecord,
  fetchStudyRecords,
  insertStudyRecord,
  updateStudyRecord,
} from '../lib/studyRecords'
import type { StudyRecord } from '../types/studyRecord'

// Supabase との通信は lib/studyRecords に閉じているので、そこだけを偽物にする。
// このテストが保証するのは「画面が通信結果をどう扱うか」であり、通信そのものと RLS は対象外
vi.mock('../lib/studyRecords', () => ({
  fetchStudyRecords: vi.fn(),
  insertStudyRecord: vi.fn(),
  updateStudyRecord: vi.fn(),
  deleteStudyRecord: vi.fn(),
}))

const fetchStudyRecordsMock = vi.mocked(fetchStudyRecords)
const insertStudyRecordMock = vi.mocked(insertStudyRecord)
const updateStudyRecordMock = vi.mocked(updateStudyRecord)
const deleteStudyRecordMock = vi.mocked(deleteStudyRecord)

const USER_ID = 'user-1'

// DB が採番したふりをする。登録のたびに id と createdAt が進む
let insertCount = 0

const buildRecord = (overrides: Partial<StudyRecord> = {}): StudyRecord => ({
  id: 'record-1',
  studyDate: '2026-07-12',
  category: 'React',
  durationMinutes: 60,
  note: 'useStateを学習した',
  createdAt: '2026-07-12T10:00:00.000Z',
  updatedAt: '2026-07-12T10:00:00.000Z',
  ...overrides,
})

type RecordValues = {
  studyDate?: string
  category?: string
  durationMinutes?: string
  note?: string
}

const fillForm = ({
  studyDate = '2026-07-12',
  category = 'React',
  durationMinutes = '60',
  note = 'useStateを学習した',
}: RecordValues = {}) => {
  fireEvent.change(screen.getByLabelText('学習日'), {
    target: { value: studyDate },
  })
  fireEvent.change(screen.getByLabelText('学習分野'), {
    target: { value: category },
  })
  fireEvent.change(screen.getByLabelText('学習時間（分）'), {
    target: { value: durationMinutes },
  })
  fireEvent.change(screen.getByLabelText('メモ（任意）'), {
    target: { value: note },
  })
}

const submitForm = () => {
  fireEvent.submit(
    screen.getByRole('form', { name: '学習記録を登録' }),
  )
}

// 登録が終わって一覧に出るまで待つ
const submitAndWait = async (category = 'React') => {
  submitForm()
  await screen.findByRole('heading', { level: 3, name: category })
}

// 記録が0件の状態で表示し、初回の読み込みが終わるまで待つ
const renderEmptySection = async () => {
  render(<StudyRecordSection userId={USER_ID} />)
  await screen.findByText('学習記録はありません')
}

describe('StudyRecordSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertCount = 0

    fetchStudyRecordsMock.mockResolvedValue([])
    insertStudyRecordMock.mockImplementation(async (_userId, input) => {
      insertCount += 1
      return buildRecord({
        ...input,
        id: `record-${insertCount}`,
        createdAt: `2026-07-12T10:0${insertCount}:00.000Z`,
        updatedAt: `2026-07-12T10:0${insertCount}:00.000Z`,
      })
    })
    updateStudyRecordMock.mockImplementation(async (id, input) =>
      buildRecord({ ...input, id }),
    )
    deleteStudyRecordMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('表示直後に DB から取得した学習記録を、返ってきた順で表示する', async () => {
    fetchStudyRecordsMock.mockResolvedValue([
      buildRecord({ id: 'record-2', studyDate: '2026-07-12', category: '新しい日付' }),
      buildRecord({ id: 'record-1', studyDate: '2026-07-10', category: '古い日付' }),
    ])

    render(<StudyRecordSection userId={USER_ID} />)

    expect(screen.getByText('学習記録を読み込んでいます')).toBeInTheDocument()

    const records = await screen.findAllByRole('listitem')
    expect(records).toHaveLength(2)
    expect(within(records[0]).getByText('新しい日付')).toBeInTheDocument()
    expect(within(records[1]).getByText('古い日付')).toBeInTheDocument()
    expect(fetchStudyRecordsMock).toHaveBeenCalledTimes(1)
  })

  it('取得に失敗したらエラーを表示する', async () => {
    fetchStudyRecordsMock.mockRejectedValue(new Error('接続できません'))

    render(<StudyRecordSection userId={USER_ID} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '学習記録の取得に失敗しました: 接続できません',
    )
    expect(screen.getByText('学習記録はありません')).toBeInTheDocument()
  })

  it('必須項目が空の場合は登録できない', async () => {
    await renderEmptySection()

    submitForm()

    expect(screen.getByText('学習日を入力してください')).toBeInTheDocument()
    expect(screen.getByText('学習分野を入力してください')).toBeInTheDocument()
    expect(screen.getByText('学習時間を入力してください')).toBeInTheDocument()
    expect(insertStudyRecordMock).not.toHaveBeenCalled()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('学習分野が50文字を超える場合は登録できない', async () => {
    await renderEmptySection()
    fillForm({ category: 'a'.repeat(51) })

    submitForm()

    expect(
      screen.getByText('学習分野は50文字以内で入力してください'),
    ).toBeInTheDocument()
    expect(insertStudyRecordMock).not.toHaveBeenCalled()
  })

  it.each(['0', '1441'])(
    '学習時間が範囲外（%s分）の場合は登録できない',
    async (durationMinutes) => {
      await renderEmptySection()
      fillForm({ durationMinutes })

      submitForm()

      expect(
        screen.getByText('学習時間は1〜1440分の整数で入力してください'),
      ).toBeInTheDocument()
      expect(insertStudyRecordMock).not.toHaveBeenCalled()
    },
  )

  it('学習時間が小数の場合は登録できない', async () => {
    await renderEmptySection()
    fillForm({ durationMinutes: '1.5' })

    submitForm()

    expect(
      screen.getByText('学習時間は1〜1440分の整数で入力してください'),
    ).toBeInTheDocument()
    expect(insertStudyRecordMock).not.toHaveBeenCalled()
  })

  it('メモが500文字を超える場合は登録できない', async () => {
    await renderEmptySection()
    fillForm({ note: 'a'.repeat(501) })

    submitForm()

    expect(
      screen.getByText('メモは500文字以内で入力してください'),
    ).toBeInTheDocument()
    expect(insertStudyRecordMock).not.toHaveBeenCalled()
  })

  it('正しい入力でログイン中のユーザーの記録として保存し、一覧に表示する', async () => {
    await renderEmptySection()
    fillForm()

    await submitAndWait()

    expect(insertStudyRecordMock).toHaveBeenCalledWith(USER_ID, {
      studyDate: '2026-07-12',
      category: 'React',
      durationMinutes: 60,
      note: 'useStateを学習した',
    })

    const record = screen.getByRole('listitem')
    expect(within(record).getByText('React')).toBeInTheDocument()
    expect(within(record).getByText('2026-07-12')).toBeInTheDocument()
    expect(within(record).getByText('学習時間: 60分')).toBeInTheDocument()
    expect(within(record).getByText('useStateを学習した')).toBeInTheDocument()
  })

  it('登録後にフォームを初期化する', async () => {
    await renderEmptySection()
    fillForm()

    await submitAndWait()

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>('学習日').value).toBe('')
    })
    expect(screen.getByLabelText<HTMLInputElement>('学習分野').value).toBe('')
    expect(
      screen.getByLabelText<HTMLInputElement>('学習時間（分）').value,
    ).toBe('')
    expect(screen.getByLabelText<HTMLTextAreaElement>('メモ（任意）').value).toBe(
      '',
    )
  })

  it('保存に失敗したら入力を残してエラーを表示する', async () => {
    insertStudyRecordMock.mockRejectedValue(new Error('権限がありません'))
    await renderEmptySection()
    fillForm()

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '学習記録の保存に失敗しました: 権限がありません',
    )
    expect(screen.getByLabelText<HTMLInputElement>('学習分野').value).toBe(
      'React',
    )
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('学習日の新しい順で表示する', async () => {
    await renderEmptySection()
    fillForm({ studyDate: '2026-07-10', category: '古い日付' })
    await submitAndWait('古い日付')
    fillForm({ studyDate: '2026-07-12', category: '新しい日付' })
    await submitAndWait('新しい日付')

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('新しい日付')).toBeInTheDocument()
    expect(within(records[1]).getByText('古い日付')).toBeInTheDocument()
  })

  it('同じ学習日では登録日時（DB の created_at）の新しい順で表示する', async () => {
    await renderEmptySection()
    fillForm({ category: '先に登録' })
    await submitAndWait('先に登録')
    fillForm({ category: '後に登録' })
    await submitAndWait('後に登録')

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('後に登録')).toBeInTheDocument()
    expect(within(records[1]).getByText('先に登録')).toBeInTheDocument()
  })

  it('登録済みの学習記録を編集して DB に更新する', async () => {
    await renderEmptySection()
    fillForm()
    await submitAndWait()

    fireEvent.click(screen.getByRole('button', { name: '編集する' }))

    expect(
      screen.getByRole('heading', { name: '学習記録を編集' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText<HTMLInputElement>('学習日').value).toBe(
      '2026-07-12',
    )
    expect(screen.getByLabelText<HTMLInputElement>('学習分野').value).toBe(
      'React',
    )
    expect(
      screen.getByLabelText<HTMLInputElement>('学習時間（分）').value,
    ).toBe('60')
    expect(screen.getByLabelText<HTMLTextAreaElement>('メモ（任意）').value).toBe(
      'useStateを学習した',
    )

    fillForm({
      studyDate: '2026-07-13',
      category: 'TypeScript',
      durationMinutes: '90',
      note: '型を学習した',
    })
    fireEvent.submit(screen.getByRole('form', { name: '学習記録を編集' }))

    await screen.findByRole('heading', { level: 3, name: 'TypeScript' })

    expect(updateStudyRecordMock).toHaveBeenCalledWith('record-1', {
      studyDate: '2026-07-13',
      category: 'TypeScript',
      durationMinutes: 90,
      note: '型を学習した',
    })

    const record = screen.getByRole('listitem')
    expect(within(record).getByText('2026-07-13')).toBeInTheDocument()
    expect(within(record).getByText('学習時間: 90分')).toBeInTheDocument()
    expect(within(record).getByText('型を学習した')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: '学習記録を登録' }),
    ).toBeInTheDocument()
  })

  it('編集をキャンセルして登録フォームへ戻る', async () => {
    await renderEmptySection()
    fillForm()
    await submitAndWait()

    fireEvent.click(screen.getByRole('button', { name: '編集する' }))
    fireEvent.change(screen.getByLabelText('学習分野'), {
      target: { value: '変更途中' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(
      screen.getByRole('heading', { name: '学習記録を登録' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText<HTMLInputElement>('学習分野').value).toBe('')
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryByText('変更途中')).not.toBeInTheDocument()
    expect(updateStudyRecordMock).not.toHaveBeenCalled()
  })

  it('学習日の編集後に一覧を並べ替える', async () => {
    await renderEmptySection()
    fillForm({ studyDate: '2026-07-10', category: '編集対象' })
    await submitAndWait('編集対象')
    fillForm({ studyDate: '2026-07-12', category: '現在の先頭' })
    await submitAndWait('現在の先頭')

    const targetRecord = screen
      .getByText('編集対象')
      .closest('li') as HTMLLIElement
    fireEvent.click(
      within(targetRecord).getByRole('button', { name: '編集する' }),
    )
    fireEvent.change(screen.getByLabelText('学習日'), {
      target: { value: '2026-07-13' },
    })
    fireEvent.submit(screen.getByRole('form', { name: '学習記録を編集' }))

    await screen.findByText('2026-07-13')

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('編集対象')).toBeInTheDocument()
    expect(within(records[1]).getByText('現在の先頭')).toBeInTheDocument()
  })

  it('確認後に学習記録を DB から削除する', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await renderEmptySection()
    fillForm()
    await submitAndWait()

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(confirm).toHaveBeenCalledWith(
      '「React」の学習記録を削除しますか？',
    )
    await screen.findByText('学習記録はありません')
    expect(deleteStudyRecordMock).toHaveBeenCalledWith('record-1')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('削除確認をキャンセルした場合は学習記録を残し、DB も呼ばない', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await renderEmptySection()
    fillForm()
    await submitAndWait()

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
    expect(deleteStudyRecordMock).not.toHaveBeenCalled()
  })

  it('削除に失敗したら学習記録を残してエラーを表示する', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteStudyRecordMock.mockRejectedValue(new Error('接続できません'))
    await renderEmptySection()
    fillForm()
    await submitAndWait()

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '学習記録の削除に失敗しました: 接続できません',
    )
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
  })
})
