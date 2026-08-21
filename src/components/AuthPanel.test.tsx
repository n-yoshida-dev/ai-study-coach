import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthError, type Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPanel from './AuthPanel'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

const signInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth)
const signOut = vi.mocked(supabase.auth.signOut)

const session = {
  user: { email: 'learner@example.com' },
} as Session

describe('AuthPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    })
    signOut.mockResolvedValue({ error: null })
  })

  it('セッション確認中はログインボタンを表示しない', () => {
    render(<AuthPanel session={null} isLoading />)

    expect(screen.getByText('ログイン状態を確認しています')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Google でログイン' }),
    ).not.toBeInTheDocument()
  })

  it('未ログインならログインボタンを表示し、押すと Google 認証を開始する', async () => {
    render(<AuthPanel session={null} isLoading={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Google でログイン' }))

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
    })
  })

  it('ログイン済みならメールアドレスとログアウトボタンを表示する', () => {
    render(<AuthPanel session={session} isLoading={false} />)

    expect(screen.getByText('learner@example.com')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Google でログイン' }),
    ).not.toBeInTheDocument()
  })

  it('ログアウトボタンを押すとサインアウトする', async () => {
    render(<AuthPanel session={session} isLoading={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
    })
  })

  it('ログインに失敗したらエラーメッセージを表示する', async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: null },
      error: new AuthError('boom'),
    })

    render(<AuthPanel session={null} isLoading={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Google でログイン' }))

    expect(
      await screen.findByText(
        'ログインに失敗しました。時間をおいて再度お試しください',
      ),
    ).toBeInTheDocument()
  })
})
