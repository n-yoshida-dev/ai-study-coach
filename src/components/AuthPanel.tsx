import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Props = {
  session: Session | null
  isLoading: boolean
}

function AuthPanel({ session, isLoading }: Props) {
  const [errorMessage, setErrorMessage] = useState('')

  const signIn = async () => {
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

    if (error) {
      setErrorMessage('ログインに失敗しました。時間をおいて再度お試しください')
    }
  }

  const signOut = async () => {
    setErrorMessage('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage('ログアウトに失敗しました。時間をおいて再度お試しください')
    }
  }

  if (isLoading) {
    return (
      <div className="auth-panel">
        <p className="auth-status">ログイン状態を確認しています</p>
      </div>
    )
  }

  return (
    <div className="auth-panel">
      {session ? (
        <>
          <span className="auth-user">{session.user.email}</span>
          <button type="button" className="button-secondary" onClick={signOut}>
            ログアウト
          </button>
        </>
      ) : (
        <button type="button" onClick={signIn}>
          Google でログイン
        </button>
      )}
      {errorMessage && <p className="error auth-error">{errorMessage}</p>}
    </div>
  )
}

export default AuthPanel
