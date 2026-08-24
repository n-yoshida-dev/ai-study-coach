import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StudyRecordSection from './StudyRecordSection'

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

describe('StudyRecordSection', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('必須項目が空の場合は登録できない', () => {
    render(<StudyRecordSection />)

    submitForm()

    expect(screen.getByText('学習日を入力してください')).toBeInTheDocument()
    expect(screen.getByText('学習分野を入力してください')).toBeInTheDocument()
    expect(screen.getByText('学習時間を入力してください')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('学習分野が50文字を超える場合は登録できない', () => {
    render(<StudyRecordSection />)
    fillForm({ category: 'a'.repeat(51) })

    submitForm()

    expect(
      screen.getByText('学習分野は50文字以内で入力してください'),
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it.each(['0', '1441'])(
    '学習時間が範囲外（%s分）の場合は登録できない',
    (durationMinutes) => {
      render(<StudyRecordSection />)
      fillForm({ durationMinutes })

      submitForm()

      expect(
        screen.getByText('学習時間は1〜1440分の整数で入力してください'),
      ).toBeInTheDocument()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    },
  )

  it('学習時間が小数の場合は登録できない', () => {
    render(<StudyRecordSection />)
    fillForm({ durationMinutes: '1.5' })

    submitForm()

    expect(
      screen.getByText('学習時間は1〜1440分の整数で入力してください'),
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('メモが500文字を超える場合は登録できない', () => {
    render(<StudyRecordSection />)
    fillForm({ note: 'a'.repeat(501) })

    submitForm()

    expect(
      screen.getByText('メモは500文字以内で入力してください'),
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('正しい入力で学習記録を登録し一覧に表示する', () => {
    render(<StudyRecordSection />)
    fillForm()

    submitForm()

    const record = screen.getByRole('listitem')
    expect(within(record).getByText('React')).toBeInTheDocument()
    expect(within(record).getByText('2026-07-12')).toBeInTheDocument()
    expect(within(record).getByText('学習時間: 60分')).toBeInTheDocument()
    expect(within(record).getByText('useStateを学習した')).toBeInTheDocument()
  })

  it('登録後にフォームを初期化する', () => {
    render(<StudyRecordSection />)
    fillForm()

    submitForm()

    expect(screen.getByLabelText<HTMLInputElement>('学習日').value).toBe('')
    expect(screen.getByLabelText<HTMLInputElement>('学習分野').value).toBe('')
    expect(
      screen.getByLabelText<HTMLInputElement>('学習時間（分）').value,
    ).toBe('')
    expect(screen.getByLabelText<HTMLTextAreaElement>('メモ（任意）').value).toBe(
      '',
    )
  })

  it('学習日の新しい順で表示する', () => {
    render(<StudyRecordSection />)
    fillForm({ studyDate: '2026-07-10', category: '古い日付' })
    submitForm()
    fillForm({ studyDate: '2026-07-12', category: '新しい日付' })
    submitForm()

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('新しい日付')).toBeInTheDocument()
    expect(within(records[1]).getByText('古い日付')).toBeInTheDocument()
  })

  it('同じ学習日では登録日時の新しい順で表示する', () => {
    vi.useFakeTimers()
    render(<StudyRecordSection />)

    vi.setSystemTime(new Date('2026-07-12T10:00:00.000Z'))
    fillForm({ category: '先に登録' })
    submitForm()

    vi.setSystemTime(new Date('2026-07-12T11:00:00.000Z'))
    fillForm({ category: '後に登録' })
    submitForm()

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('後に登録')).toBeInTheDocument()
    expect(within(records[1]).getByText('先に登録')).toBeInTheDocument()
  })

  it('登録済みの学習記録を編集する', () => {
    render(<StudyRecordSection />)
    fillForm()
    submitForm()

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

    const record = screen.getByRole('listitem')
    expect(within(record).getByText('TypeScript')).toBeInTheDocument()
    expect(within(record).getByText('2026-07-13')).toBeInTheDocument()
    expect(within(record).getByText('学習時間: 90分')).toBeInTheDocument()
    expect(within(record).getByText('型を学習した')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: '学習記録を登録' }),
    ).toBeInTheDocument()
  })

  it('編集をキャンセルして登録フォームへ戻る', () => {
    render(<StudyRecordSection />)
    fillForm()
    submitForm()

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
  })

  it('学習日の編集後に一覧を並べ替える', () => {
    render(<StudyRecordSection />)
    fillForm({ studyDate: '2026-07-10', category: '編集対象' })
    submitForm()
    fillForm({ studyDate: '2026-07-12', category: '現在の先頭' })
    submitForm()

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

    const records = screen.getAllByRole('listitem')
    expect(within(records[0]).getByText('編集対象')).toBeInTheDocument()
    expect(within(records[1]).getByText('現在の先頭')).toBeInTheDocument()
  })

  it('確認後に学習記録を削除する', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<StudyRecordSection />)
    fillForm()
    submitForm()

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(confirm).toHaveBeenCalledWith(
      '「React」の学習記録を削除しますか？',
    )
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('学習記録はありません')).toBeInTheDocument()
  })

  it('削除確認をキャンセルした場合は学習記録を残す', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<StudyRecordSection />)
    fillForm()
    submitForm()

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)
  })
})
