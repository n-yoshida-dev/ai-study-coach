import { useEffect, useState } from 'react'
import StudyRecordForm from './StudyRecordForm'
import StudyRecordList from './StudyRecordList'
import {
  deleteStudyRecord,
  fetchStudyRecords,
  insertStudyRecord,
  updateStudyRecord,
} from '../lib/studyRecords'
import type { StudyRecord, StudyRecordInput } from '../types/studyRecord'

type StudyRecordSectionProps = {
  userId: string
}

function compareStudyRecords(a: StudyRecord, b: StudyRecord) {
  return (
    b.studyDate.localeCompare(a.studyDate) ||
    b.createdAt.localeCompare(a.createdAt)
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

// ログイン済みのユーザーだけが使う本体。
// 記録の正本は Supabase にあり、ここで持つ records は画面に出すための写し。
// ログアウトで App がこのコンポーネントを外すと、写しもいっしょに消える
function StudyRecordSection({ userId }: StudyRecordSectionProps) {
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const editingRecord =
    records.find((record) => record.id === editingRecordId) ?? null

  // 表示された直後に自分の記録を DB から読む。
  // 読み終わる前に画面が閉じられたら結果を捨てる（isActive）
  useEffect(() => {
    let isActive = true

    setIsLoading(true)
    fetchStudyRecords()
      .then((fetchedRecords) => {
        if (!isActive) {
          return
        }

        setRecords(fetchedRecords)
        setErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        setErrorMessage(
          `学習記録の取得に失敗しました: ${getErrorMessage(error)}`,
        )
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [userId])

  // 戻り値は「保存できたか」。フォームはこれを見て入力を消すかどうかを決める
  const addRecord = async (input: StudyRecordInput) => {
    try {
      const savedRecord = await insertStudyRecord(userId, input)

      setRecords((current) =>
        [savedRecord, ...current].sort(compareStudyRecords),
      )
      setErrorMessage(null)
      return true
    } catch (error) {
      setErrorMessage(`学習記録の保存に失敗しました: ${getErrorMessage(error)}`)
      return false
    }
  }

  const updateRecord = async (input: StudyRecordInput) => {
    if (!editingRecordId) {
      return false
    }

    try {
      const savedRecord = await updateStudyRecord(editingRecordId, input)

      setRecords((current) =>
        current
          .map((record) =>
            record.id === savedRecord.id ? savedRecord : record,
          )
          .sort(compareStudyRecords),
      )
      setErrorMessage(null)
      setEditingRecordId(null)
      return true
    } catch (error) {
      setErrorMessage(`学習記録の更新に失敗しました: ${getErrorMessage(error)}`)
      return false
    }
  }

  const deleteRecord = async (record: StudyRecord) => {
    const shouldDelete = window.confirm(
      `「${record.category}」の学習記録を削除しますか？`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteStudyRecord(record.id)

      setRecords((current) =>
        current.filter((currentRecord) => currentRecord.id !== record.id),
      )
      setErrorMessage(null)

      if (editingRecordId === record.id) {
        setEditingRecordId(null)
      }
    } catch (error) {
      setErrorMessage(`学習記録の削除に失敗しました: ${getErrorMessage(error)}`)
    }
  }

  return (
    <>
      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="content-grid">
        <StudyRecordForm
          key={editingRecord?.id ?? 'new-record'}
          record={editingRecord}
          onSubmit={editingRecord ? updateRecord : addRecord}
          onCancel={() => setEditingRecordId(null)}
        />
        <StudyRecordList
          records={records}
          isLoading={isLoading}
          onEdit={(record) => setEditingRecordId(record.id)}
          onDelete={deleteRecord}
        />
      </div>
    </>
  )
}

export default StudyRecordSection
