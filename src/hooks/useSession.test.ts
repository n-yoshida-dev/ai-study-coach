import { act, renderHook, waitFor } from '@testing-library/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from './useSession'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const getSession = vi.mocked(supabase.auth.getSession)
const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)

const session = { user: { email: 'learner@example.com' } } as Session

const unsubscribe = vi.fn()
let notifyAuthChange: (event: AuthChangeEvent, session: Session | null) => void

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    onAuthStateChange.mockImplementation((callback) => {
      notifyAuthChange = callback
      return {
        data: { subscription: { id: 'test', callback, unsubscribe } },
      }
    })
  })

  it('保存済みセッションが無ければ未ログインで確認完了になる', async () => {
    const { result } = renderHook(() => useSession())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.session).toBeNull()
  })

  it('保存済みセッションがあればそれを返す', async () => {
    getSession.mockResolvedValue({ data: { session }, error: null })

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.session).toEqual(session)
    })
  })

  it('ログイン・ログアウトの通知でセッションを更新する', async () => {
    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => notifyAuthChange('SIGNED_IN', session))
    expect(result.current.session).toEqual(session)

    act(() => notifyAuthChange('SIGNED_OUT', null))
    expect(result.current.session).toBeNull()
  })

  it('アンマウント時に購読を解除する', async () => {
    const { unmount } = renderHook(() => useSession())

    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalledTimes(1)
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
