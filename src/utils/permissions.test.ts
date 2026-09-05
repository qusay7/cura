import { describe, it, expect, beforeEach } from 'vitest'
import { hasPermission, getPermissions, getRole } from './permissions'

describe('hasPermission', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('grants every permission to a SuperAdmin, even ones not in their permissions list', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin' }))
    localStorage.setItem('permissions', JSON.stringify([]))

    expect(hasPermission('plans.manage')).toBe(true)
    expect(hasPermission('anything.at.all')).toBe(true)
  })

  it('denies a permission not present in a non-SuperAdmin user\'s permissions list', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin' }))
    localStorage.setItem('permissions', JSON.stringify(['patients.view']))

    expect(hasPermission('schedules.absence.add')).toBe(false)
  })

  it('grants a permission present in a non-SuperAdmin user\'s permissions list', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin' }))
    localStorage.setItem('permissions', JSON.stringify(['schedules.absence.add']))

    expect(hasPermission('schedules.absence.add')).toBe(true)
  })

  it('denies everything when nothing is stored in localStorage', () => {
    expect(hasPermission('patients.view')).toBe(false)
  })
})

describe('getPermissions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the stored permissions array', () => {
    localStorage.setItem('permissions', JSON.stringify(['patients.view', 'doctors.view']))
    expect(getPermissions()).toEqual(['patients.view', 'doctors.view'])
  })

  it('returns an empty array when nothing is stored', () => {
    expect(getPermissions()).toEqual([])
  })
})

describe('getRole', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the stored user role', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin' }))
    expect(getRole()).toBe('SuperAdmin')
  })

  it('returns an empty string when no user is stored', () => {
    expect(getRole()).toBe('')
  })
})
