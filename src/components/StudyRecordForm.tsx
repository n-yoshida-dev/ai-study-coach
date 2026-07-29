import { useState, type FormEvent } from 'react'
import type { StudyRecord, StudyRecordInput } from '../types/studyRecord'

type StudyRecordFormProps = {
  record: StudyRecord | null
  onSubmit: (input: StudyRecordInput) => void
  onCancel: () => void
}

type FormValues = {
  studyDate: string
  category: string
  durationMinutes: string
  note: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  studyDate: '',
  category: '',
  durationMinutes: '',
  note: '',
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.studyDate) {
    errors.studyDate = '学習日を入力してください'
  }

  if (!values.category.trim()) {
    errors.category = '学習分野を入力してください'
  } else if (values.category.length > 50) {
    errors.category = '学習分野は50文字以内で入力してください'
  }

  if (!values.durationMinutes.trim()) {
    errors.durationMinutes = '学習時間を入力してください'
  } else {
    const durationMinutes = Number(values.durationMinutes)

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440
    ) {
      errors.durationMinutes = '学習時間は1〜1440分の整数で入力してください'
    }
  }

  if (values.note.length > 500) {
    errors.note = 'メモは500文字以内で入力してください'
  }

  return errors
}

function StudyRecordForm({
  record,
  onSubmit,
  onCancel,
}: StudyRecordFormProps) {
  const isEditing = record !== null
  const [values, setValues] = useState<FormValues>(() =>
    record
      ? {
          studyDate: record.studyDate,
          category: record.category,
          durationMinutes: String(record.durationMinutes),
          note: record.note,
        }
      : initialValues,
  )
  const [errors, setErrors] = useState<FormErrors>({})

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      studyDate: values.studyDate,
      category: values.category.trim(),
      durationMinutes: Number(values.durationMinutes),
      note: values.note,
    })

    setValues(initialValues)
    setErrors({})
  }

  return (
    <section className="panel" aria-labelledby="record-form-heading">
      <h2 id="record-form-heading">
        {isEditing ? '学習記録を編集' : '学習記録を登録'}
      </h2>
      <form aria-labelledby="record-form-heading" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="study-date">学習日</label>
          <input
            id="study-date"
            type="date"
            required
            value={values.studyDate}
            aria-invalid={Boolean(errors.studyDate)}
            aria-describedby={errors.studyDate ? 'study-date-error' : undefined}
            onChange={(event) => updateValue('studyDate', event.target.value)}
          />
          {errors.studyDate && (
            <p className="error" id="study-date-error">
              {errors.studyDate}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="category">学習分野</label>
          <input
            id="category"
            type="text"
            required
            maxLength={50}
            value={values.category}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'category-error' : undefined}
            onChange={(event) => updateValue('category', event.target.value)}
          />
          {errors.category && (
            <p className="error" id="category-error">
              {errors.category}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="duration-minutes">学習時間（分）</label>
          <input
            id="duration-minutes"
            type="number"
            required
            min={1}
            max={1440}
            step={1}
            value={values.durationMinutes}
            aria-invalid={Boolean(errors.durationMinutes)}
            aria-describedby={
              errors.durationMinutes ? 'duration-minutes-error' : undefined
            }
            onChange={(event) =>
              updateValue('durationMinutes', event.target.value)
            }
          />
          {errors.durationMinutes && (
            <p className="error" id="duration-minutes-error">
              {errors.durationMinutes}
            </p>
          )}
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="note">メモ（任意）</label>
          <textarea
            id="note"
            maxLength={500}
            rows={5}
            value={values.note}
            aria-invalid={Boolean(errors.note)}
            aria-describedby={errors.note ? 'note-error' : undefined}
            onChange={(event) => updateValue('note', event.target.value)}
          />
          {errors.note && (
            <p className="error" id="note-error">
              {errors.note}
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit">{isEditing ? '更新する' : '登録する'}</button>
          {isEditing && (
            <button
              type="button"
              className="button-secondary"
              onClick={onCancel}
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

export default StudyRecordForm
