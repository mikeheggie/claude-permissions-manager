import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedback, BANNER_DELAY_MS } from './useFeedback'
import { FEEDBACK_SUBMITTED_KEY, FEEDBACK_BANNER_DISMISSED_KEY } from '@/types/feedback'

describe('useFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the banner hidden until the delay has elapsed', () => {
    const { result } = renderHook(() => useFeedback())

    expect(result.current.showBanner).toBe(false)

    act(() => {
      vi.advanceTimersByTime(BANNER_DELAY_MS - 1)
    })
    expect(result.current.showBanner).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.showBanner).toBe(true)
  })

  it('never shows the banner when it was previously dismissed', () => {
    window.localStorage.setItem(FEEDBACK_BANNER_DISMISSED_KEY, 'true')
    const { result } = renderHook(() => useFeedback())

    act(() => {
      vi.advanceTimersByTime(BANNER_DELAY_MS)
    })
    expect(result.current.showBanner).toBe(false)
  })

  it('never shows the banner when feedback was already submitted', () => {
    window.localStorage.setItem(FEEDBACK_SUBMITTED_KEY, 'true')
    const { result } = renderHook(() => useFeedback())

    act(() => {
      vi.advanceTimersByTime(BANNER_DELAY_MS)
    })
    expect(result.current.showBanner).toBe(false)
  })

  it('hides the banner and persists the flag when dismissed', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      vi.advanceTimersByTime(BANNER_DELAY_MS)
    })
    expect(result.current.showBanner).toBe(true)

    act(() => {
      result.current.dismissBanner()
    })

    expect(result.current.showBanner).toBe(false)
    expect(window.localStorage.getItem(FEEDBACK_BANNER_DISMISSED_KEY)).toBe('true')
  })

  it('hides the banner permanently after submission', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      vi.advanceTimersByTime(BANNER_DELAY_MS)
      result.current.markAsSubmitted()
    })

    expect(result.current.showBanner).toBe(false)
    expect(window.localStorage.getItem(FEEDBACK_SUBMITTED_KEY)).toBe('true')
  })
})
