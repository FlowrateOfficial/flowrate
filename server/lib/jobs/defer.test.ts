import { describe, expect, it, vi } from 'vitest'
import { deferTask } from './defer'

describe('deferTask', () => {
  it('runs async work without blocking the caller', async () => {
    const spy = vi.fn().mockResolvedValue(undefined)
    deferTask('test', spy)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(spy).toHaveBeenCalledOnce()
  })

  it('logs errors without throwing to the caller', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    deferTask('fail', async () => {
      throw new Error('boom')
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
