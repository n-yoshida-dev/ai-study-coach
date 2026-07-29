import { useState } from 'react'
import StudyRecordForm from './components/StudyRecordForm'
import StudyRecordList from './components/StudyRecordList'
import type { StudyRecord, StudyRecordInput } from './types/studyRecord'

function compareStudyRecords(a: StudyRecord, b: StudyRecord) {
  return (
    b.studyDate.localeCompare(a.studyDate) ||
    b.createdAt.localeCompare(a.createdAt)
  )
}

function App() {
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const editingRecord =
    records.find((record) => record.id === editingRecordId) ?? null

  const addRecord = (input: StudyRecordInput) => {
    const timestamp = new Date().toISOString()
    const newRecord: StudyRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setRecords((current) =>
      [newRecord, ...current].sort(compareStudyRecords),
    )
  }

  const updateRecord = (input: StudyRecordInput) => {
    if (!editingRecordId) {
      return
    }

    const timestamp = new Date().toISOString()

    setRecords((current) =>
      current
        .map((record) =>
          record.id === editingRecordId
            ? { ...record, ...input, updatedAt: timestamp }
            : record,
        )
        .sort(compareStudyRecords),
    )
    setEditingRecordId(null)
  }

  const deleteRecord = (record: StudyRecord) => {
    const shouldDelete = window.confirm(
      `「${record.category}」の学習記録を削除しますか？`,
    )

    if (!shouldDelete) {
      return
    }

    setRecords((current) =>
      current.filter((currentRecord) => currentRecord.id !== record.id),
    )

    if (editingRecordId === record.id) {
      setEditingRecordId(null)
    }
  }

  return (
    <main>
      <header className="page-header">
        <h1>AI Study Coach</h1>
        <p>学習記録を管理するアプリ</p>
      </header>

      <div className="content-grid">
        <StudyRecordForm
          key={editingRecord?.id ?? 'new-record'}
          record={editingRecord}
          onSubmit={editingRecord ? updateRecord : addRecord}
          onCancel={() => setEditingRecordId(null)}
        />
        <StudyRecordList
          records={records}
          onEdit={(record) => setEditingRecordId(record.id)}
          onDelete={deleteRecord}
        />
      </div>
    </main>
  )
}

export default App
