import { describe, expect, it } from 'vitest'
import { buildAttention, clientSituation, clientVideoStep, groupByTurn, projectNextStep, videoNextStep } from '../../utils/workflow'

const video = (id, status, extra = {}) => ({ id, title: `Video ${id}`, status, openRevisionCount: 0, overdue: false, deadline: null, ...extra })
const project = (extra = {}) => ({
  id: 1, name: 'October', clientName: 'Rahul', status: 'ACTIVE',
  payment: { balance: '0.00' }, videos: { total: 0, byStatus: { DELIVERED: 0 } }, ...extra,
})

describe('videoNextStep', () => {
  it.each([
    ['PENDING', 'client', 'MEDIA_RECEIVED'],
    ['MEDIA_RECEIVED', 'admin', 'EDITING'],
    ['EDITING', 'admin', 'REVIEW'],
    ['REVIEW', 'client', 'COMPLETED'],
    ['COMPLETED', 'admin', 'DELIVERED'],
  ])('%s → owner %s, offers %s', (status, owner, transition) => {
    const step = videoNextStep(video(1, status))
    expect(step.owner).toBe(owner)
    expect(step.action.transition).toBe(transition)
    expect(step.after).toBeTruthy()
  })

  it('a video in review with open change requests is the editor’s turn', () => {
    const step = videoNextStep(video(1, 'REVIEW', { openRevisionCount: 2 }))
    expect(step.owner).toBe('admin')
    expect(step.title).toBe('2 change requests to address')
    expect(step.action.open).toBe(true)
  })

  it('delivered with no open changes is done; with a change request it needs the editor', () => {
    expect(videoNextStep(video(1, 'DELIVERED')).owner).toBe('done')
    expect(videoNextStep(video(1, 'DELIVERED', { openRevisionCount: 1 })).key).toBe('post-delivery-revision')
  })
})

describe('groupByTurn', () => {
  it('splits by whose turn it is and puts overdue work first', () => {
    const groups = groupByTurn([
      video(1, 'EDITING'), video(2, 'PENDING'), video(3, 'DELIVERED'),
      video(4, 'MEDIA_RECEIVED', { overdue: true }), video(5, 'REVIEW', { openRevisionCount: 1 }),
    ])
    expect(groups.admin.map((v) => v.id)).toEqual([4, 5, 1])
    expect(groups.client.map((v) => v.id)).toEqual([2])
    expect(groups.done.map((v) => v.id)).toEqual([3])
  })
})

describe('projectNextStep', () => {
  it('an empty project asks for the first video', () => {
    expect(projectNextStep(project(), []).key).toBe('add-first-video')
  })

  it('picks the most urgent video that needs the editor', () => {
    const step = projectNextStep(project(), [video(1, 'EDITING'), video(2, 'COMPLETED')])
    expect(step.key).toBe('video:deliver')
    expect(step.video.id).toBe(2)
    expect(step.detail).toContain('1 more video also needs you')
  })

  it('waits on the client when nothing needs the editor', () => {
    expect(projectNextStep(project(), [video(1, 'PENDING'), video(2, 'DELIVERED')]).key).toBe('waiting-on-client')
  })

  it('asks for payment once everything is delivered, then to close the project', () => {
    const delivered = [video(1, 'DELIVERED')]
    expect(projectNextStep(project({ payment: { balance: '11000.00' } }), delivered).key).toBe('record-payment')
    expect(projectNextStep(project(), delivered).key).toBe('complete-project')
    expect(projectNextStep(project({ status: 'COMPLETED' }), delivered).key).toBe('finished')
  })
})

describe('buildAttention', () => {
  it('ranks inquiries and editor work above waiting items and surfaces collectable balances', () => {
    const { needsYou, waiting } = buildAttention({
      inquiries: [{ id: 9, name: 'Priya', contentType: 'Podcasts', videosPerMonth: 4 }],
      videoItems: [
        { video: video(1, 'PENDING'), projectName: 'P', clientName: 'C' },
        { video: video(2, 'EDITING'), projectName: 'P', clientName: 'C' },
        { video: video(3, 'COMPLETED', { overdue: true }), projectName: 'P', clientName: 'C' },
      ],
      activeProjects: [project({ id: 7, videos: { total: 0, byStatus: { DELIVERED: 0 } } })],
      paymentProjects: [project({ id: 8, payment: { balance: '5000.00' }, videos: { total: 2, byStatus: { DELIVERED: 2 } } })],
    })
    expect(needsYou.map((i) => i.id)).toEqual(['video-3', 'inquiry-9', 'payment-8', 'video-2', 'project-7'])
    expect(waiting.map((i) => i.id)).toEqual(['video-1'])
  })
})

describe('clientSituation', () => {
  it('tells the client what is waiting for them', () => {
    const situation = clientSituation({ payment: { balance: '15000.00' } }, [
      video(1, 'REVIEW'), video(2, 'REVIEW', { openRevisionCount: 1 }), video(3, 'PENDING'), video(4, 'DELIVERED'),
    ])
    expect(situation.headline).toBe('1 video ready for your review.')
    expect(situation.review.map((v) => v.id)).toEqual([1])
    expect(situation.awaitingFootage.map((v) => v.id)).toEqual([3])
    expect(situation.openChanges).toBe(1)
    expect(situation.balance).toBe(15000)
  })
})

describe('clientVideoStep', () => {
  it.each([
    ['PENDING', 0, 'send-footage', 'client'],
    ['EDITING', 0, 'editing', 'admin'],
    ['REVIEW', 0, 'review', 'client'],
    ['REVIEW', 2, 'changes-in-progress', 'admin'],
    ['COMPLETED', 0, 'finalizing', 'admin'],
    ['DELIVERED', 0, 'delivered', 'done'],
  ])('%s with %i open → %s (%s)', (status, open, key, owner) => {
    const step = clientVideoStep({ status, openRevisionCount: open })
    expect(step.key).toBe(key)
    expect(step.owner).toBe(owner)
  })
})
