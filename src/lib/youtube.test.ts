import { describe, expect, it } from 'vitest'

import { youtubeId } from './youtube'

describe('youtubeId', () => {
  it('reads the id from a watch URL', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=IRILqp3Og9k')).toBe('IRILqp3Og9k')
  })

  it('ignores extra query parameters around the id', () => {
    expect(youtubeId('https://www.youtube.com/watch?t=30s&v=KspO4huy7ek&list=abc')).toBe(
      'KspO4huy7ek',
    )
  })

  it('reads a shortened youtu.be link, with or without a trailing path', () => {
    expect(youtubeId('https://youtu.be/MF46EPlngic')).toBe('MF46EPlngic')
    expect(youtubeId('https://youtu.be/MF46EPlngic?t=10')).toBe('MF46EPlngic')
  })

  it('reads embed, shorts and /v/ paths', () => {
    expect(youtubeId('https://www.youtube.com/embed/308qTj-oEJg')).toBe('308qTj-oEJg')
    expect(youtubeId('https://www.youtube.com/shorts/M1Bo_CRD1zU')).toBe('M1Bo_CRD1zU')
    expect(youtubeId('https://www.youtube.com/v/c3LJWGcCqD4')).toBe('c3LJWGcCqD4')
  })

  it('accepts the no-cookie host and mobile host', () => {
    expect(youtubeId('https://www.youtube-nocookie.com/embed/IRILqp3Og9k')).toBe('IRILqp3Og9k')
    expect(youtubeId('https://m.youtube.com/watch?v=IRILqp3Og9k')).toBe('IRILqp3Og9k')
  })

  it('returns null for a non-YouTube URL', () => {
    expect(youtubeId('https://vimeo.com/12345')).toBeNull()
    expect(youtubeId('https://www.youtube.com.evil.example/watch?v=IRILqp3Og9k')).toBeNull()
  })

  it('returns null for a YouTube URL with no usable id', () => {
    expect(youtubeId('https://www.youtube.com/watch')).toBeNull()
    expect(youtubeId('https://www.youtube.com/watch?v=too-short')).toBeNull()
    expect(youtubeId('https://youtu.be/')).toBeNull()
    expect(youtubeId('https://www.youtube.com/playlist?list=abc')).toBeNull()
  })

  it('returns null for something that is not a URL at all', () => {
    expect(youtubeId('not a url')).toBeNull()
    expect(youtubeId('')).toBeNull()
  })
})
