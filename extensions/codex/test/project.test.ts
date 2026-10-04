import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ProjectResults } from '../project-state'

test('no diagnostics or a completed AI turn cannot claim project verification', () => {
  const project = new ProjectResults()
  assert.equal(project.state().status, 'unverified')
  project.configure(['test', 'build'])
  project.start('test-run', 'test'); project.finish('test-run', 0)
  assert.equal(project.state().status, 'unverified')
  project.start('build-run', 'build'); project.finish('build-run', 0)
  assert.equal(project.state().status, 'verified')
  project.errors = 2
  assert.equal(project.state().status, 'issues')
  project.errors = 0; project.warnings = 1
  assert.equal(project.state().status, 'verified')
  assert.match(project.state().text, /1 warning/)
})

test('edits invalidate passed or failed results, including a check that finishes after editing', () => {
  const project = new ProjectResults(); project.configure(['test'])
  project.start(1, 'test'); project.finish(1, 1)
  assert.equal(project.state().status, 'issues')
  project.edit()
  assert.equal(project.state().status, 'unverified')
  project.start(2, 'test'); project.edit(); project.finish(2, 0)
  assert.equal(project.state().status, 'unverified')
  project.start(3, 'test'); project.finish(3, 0)
  assert.equal(project.state().status, 'verified')
})

test('cancelled tasks, missing checks and unrelated tasks never produce a false pass', () => {
  const project = new ProjectResults(); project.configure(['test', 'missing-build'])
  project.start(1, 'test'); project.finish(1)
  project.start(2, 'unrelated'); project.finish(2, 0)
  assert.equal(project.state().status, 'unverified')
  project.start(3, 'test'); project.finish(3, 0)
  assert.equal(project.state().status, 'unverified')
  project.configure(['test'])
  assert.equal(project.state().status, 'verified')
  project.finish(3)
  assert.equal(project.state().status, 'verified', 'task end must not erase an already reported process result')
})

test('overlapping checks cannot hide a failure or use results from an older code revision', () => {
  const project = new ProjectResults(); project.configure(['test'])
  project.start(1, 'test'); project.start(1, 'test'); project.start(2, 'test')
  project.finish(1, 1); project.finish(2, 0)
  assert.equal(project.state().status, 'issues')
  project.start(3, 'test'); project.edit(); project.start(4, 'test')
  project.finish(3, 0); project.finish(4, 0)
  assert.equal(project.state().status, 'unverified')
})
