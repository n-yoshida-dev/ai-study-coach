export type StudyRecord = {
  id: string
  studyDate: string
  category: string
  durationMinutes: number
  note: string
  createdAt: string
  updatedAt: string
}

export type StudyRecordInput = Pick<
  StudyRecord,
  'studyDate' | 'category' | 'durationMinutes' | 'note'
>
