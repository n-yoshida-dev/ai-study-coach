import type { StudyRecord } from '../types/studyRecord'

type StudyRecordListProps = {
  records: StudyRecord[]
  isLoading?: boolean
  onEdit: (record: StudyRecord) => void
  onDelete: (record: StudyRecord) => void
}

function StudyRecordList({
  records,
  isLoading = false,
  onEdit,
  onDelete,
}: StudyRecordListProps) {
  return (
    <section className="panel" aria-labelledby="record-list-heading">
      <h2 id="record-list-heading">学習記録一覧</h2>

      {isLoading ? (
        <p className="empty-message">学習記録を読み込んでいます</p>
      ) : records.length === 0 ? (
        <p className="empty-message">学習記録はありません</p>
      ) : (
        <ul className="record-list">
          {records.map((record) => (
            <li key={record.id} className="record-card">
              <div className="record-heading">
                <h3>{record.category}</h3>
                <time dateTime={record.studyDate}>{record.studyDate}</time>
              </div>
              <p className="record-duration">
                学習時間: {record.durationMinutes}分
              </p>
              {record.note && <p className="record-note">{record.note}</p>}
              <div className="record-actions">
                <button type="button" onClick={() => onEdit(record)}>
                  編集する
                </button>
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => onDelete(record)}
                >
                  削除する
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default StudyRecordList
