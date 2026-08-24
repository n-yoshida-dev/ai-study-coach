import AuthPanel from './components/AuthPanel'
import StudyRecordSection from './components/StudyRecordSection'
import { useSession } from './hooks/useSession'

function App() {
  const { session, isLoading } = useSession()

  const renderContent = () => {
    // 確認が終わるまでは何も出さない。
    // ここで未ログイン画面を出すと、ログイン済みの人にも一瞬だけ案内がチラつく
    if (isLoading) {
      return null
    }

    if (!session) {
      return (
        <section className="panel sign-in-guide" aria-labelledby="sign-in-guide-heading">
          <h2 id="sign-in-guide-heading">ログインが必要です</h2>
          <p>Google でログインすると、学習記録の登録・閲覧ができます</p>
        </section>
      )
    }

    return <StudyRecordSection />
  }

  return (
    <main>
      <header className="page-header">
        <h1>AI Study Coach</h1>
        <p>学習記録を管理するアプリ</p>
        <AuthPanel session={session} isLoading={isLoading} />
      </header>

      {renderContent()}

      <footer className="page-footer">
        <p>あなたの学習を記録・可視化する学習コーチ</p>
      </footer>
    </main>
  )
}

export default App
