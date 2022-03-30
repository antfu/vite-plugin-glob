import { describe, expect, it } from 'vitest'
import { getCommonBase } from '../src/utils'

describe('getCommonBase()', async() => {
  it('basic', () => {
    expect(getCommonBase(['/a/b/*.js', '/a/c/*.js'])).toBe('/a')
  })
  it('common base', () => {
    expect(getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx'])).toBe('/a/b')
  })
  it('static file - 1', () => {
    expect(getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx', '/a/b/foo.js'])).toBe('/a/b')
  })
  it('static file - 2', () => {
    expect(getCommonBase(['/a/b/**/*.vue', '/a/b/**/*.jsx', '/a/foo.js'])).toBe('/a')
  })
  it('correct `scan()`', () => {
    expect(getCommonBase(['/a/b/**/c/foo.vue', '/a/b/c/**/*.jsx'])).toBe('/a/b')
  })
})
