// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useReveal } from './useReveal'

type FakeEntry = { isIntersecting: boolean }

/** An IntersectionObserver whose callbacks the test drives by hand. */
class FakeObserver {
  static instances: FakeObserver[] = []
  static supported = true
  observed: Element[] = []
  disconnected = false
  callback: (entries: FakeEntry[]) => void

  constructor(callback: (entries: FakeEntry[]) => void) {
    this.callback = callback
    FakeObserver.instances.push(this)
  }

  observe(node: Element) {
    this.observed.push(node)
  }

  disconnect() {
    this.disconnected = true
  }

  intersect(entries: FakeEntry[]) {
    this.callback(entries)
  }
}

function Revealed() {
  const [ref, revealed] = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} data-testid="target">
      {revealed ? 'visible' : 'hidden'}
    </div>
  )
}

function withObserver() {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
}

function withoutObserver() {
  vi.stubGlobal('IntersectionObserver', undefined)
}

function allowMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
}

function reduceMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useReveal', () => {
  it('starts hidden and observes once an observer is available', () => {
    withObserver()
    allowMotion()
    render(<Revealed />)
    expect(screen.getByTestId('target').textContent).toBe('hidden')
    expect(FakeObserver.instances).toHaveLength(1)
    expect(FakeObserver.instances[0].observed).toHaveLength(1)
  })

  it('reveals on the first intersection and stops observing', () => {
    withObserver()
    allowMotion()
    render(<Revealed />)
    const instance = FakeObserver.instances[0]

    act(() => instance.intersect([{ isIntersecting: false }]))
    expect(screen.getByTestId('target').textContent).toBe('hidden')

    act(() => instance.intersect([{ isIntersecting: true }]))
    expect(screen.getByTestId('target').textContent).toBe('visible')
    expect(instance.disconnected).toBe(true)
  })

  it('reveals once: a later non-intersecting callback does not hide it again', () => {
    withObserver()
    allowMotion()
    render(<Revealed />)
    const instance = FakeObserver.instances[0]

    act(() => instance.intersect([{ isIntersecting: true }]))
    act(() => instance.intersect([{ isIntersecting: false }]))
    expect(screen.getByTestId('target').textContent).toBe('visible')
  })

  it('reveals immediately when IntersectionObserver is missing', () => {
    withoutObserver()
    allowMotion()
    render(<Revealed />)
    expect(screen.getByTestId('target').textContent).toBe('visible')
  })

  it('reveals immediately under reduced motion and observes nothing', () => {
    withObserver()
    reduceMotion()
    render(<Revealed />)
    expect(screen.getByTestId('target').textContent).toBe('visible')
    expect(FakeObserver.instances).toHaveLength(0)
  })

  it('disconnects on unmount', () => {
    withObserver()
    allowMotion()
    const { unmount } = render(<Revealed />)
    const instance = FakeObserver.instances[0]
    unmount()
    expect(instance.disconnected).toBe(true)
  })
})
