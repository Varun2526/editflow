/**
 * Next-step guidance derived from the backend's existing state (video status, revision counts,
 * payment summary). Presentation only: which transitions are legal is still decided by the
 * backend (`allowedTransitions`), and every action goes through the existing API.
 *
 * A step answers: whose turn is it, what is happening, what to do, and what happens next.
 */

/** Lower number = more urgent. Overdue items are promoted ahead of everything else. */
const PRIORITY = {
  'resolve-revisions': 1,
  'post-delivery-revision': 1,
  deliver: 2,
  'send-to-review': 3,
  'start-editing': 4,
  'awaiting-review': 6,
  'awaiting-footage': 7,
  done: 99,
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** The next step for one video, from the editor's (admin's) point of view. */
export function videoNextStep(video) {
  const open = video.openRevisionCount ?? 0
  switch (video.status) {
    case 'PENDING':
      return {
        key: 'awaiting-footage', owner: 'client',
        title: 'Waiting for raw footage',
        detail: 'The client shares footage on Google Drive.',
        action: { label: 'Media received', transition: 'MEDIA_RECEIVED' },
        after: 'Editing can start.',
      }
    case 'MEDIA_RECEIVED':
      return {
        key: 'start-editing', owner: 'admin',
        title: 'Start editing',
        detail: 'The raw footage is in.',
        action: { label: 'Start editing', transition: 'EDITING' },
        after: 'The video moves to Editing.',
      }
    case 'EDITING':
      // Revision loop: change requests are resolved while editing, then the cut goes back for review.
      return open > 0
        ? {
          key: 'resolve-revisions', owner: 'admin',
          title: `Address ${plural(open, 'change request')}`,
          detail: 'Resolve each request once it’s done in the edit.',
          action: { label: 'Review changes', open: true },
          after: 'Send the updated cut back for review.',
        }
        : {
          key: 'send-to-review', owner: 'admin',
          title: 'Send video for review',
          detail: 'Editing in progress — send it when the cut is ready.',
          action: { label: 'Send to review', transition: 'REVIEW' },
          after: 'The client can watch it, approve it or request a revision.',
        }
    case 'REVIEW':
      return open > 0
        ? {
          key: 'resolve-revisions', owner: 'admin',
          title: `Address ${plural(open, 'change request')}`,
          detail: 'The client asked for changes with timecodes.',
          action: { label: 'Start revisions', transition: 'EDITING' },
          after: 'Resolve each request in the edit, then send it back for review.',
        }
        : {
          key: 'awaiting-review', owner: 'client',
          title: 'Waiting for client review',
          detail: 'The client approves it in their portal or requests a revision.',
          // Fallback for an approval given outside the portal (e.g. on a call).
          action: { label: 'Mark approved', transition: 'COMPLETED' },
          after: 'It’s ready to deliver.',
        }
    case 'COMPLETED':
      return {
        key: 'deliver', owner: 'admin',
        title: 'Deliver this video',
        detail: video.approvedAt ? 'The client approved it in their portal.' : 'The final cut is done.',
        action: { label: 'Deliver', transition: 'DELIVERED' },
        after: 'The delivery date is recorded and the client sees it as delivered.',
      }
    case 'DELIVERED':
      return open > 0
        ? {
          key: 'post-delivery-revision', owner: 'admin',
          title: `${plural(open, 'change request')} after delivery`,
          detail: 'The client asked for changes on a delivered video.',
          action: { label: 'Review changes', open: true },
          after: 'Reopen it for editing if the change is needed.',
        }
        : { key: 'done', owner: 'done', title: 'Delivered', detail: 'Nothing left to do.', action: null, after: null }
    default:
      return { key: 'done', owner: 'done', title: '', detail: '', action: null, after: null }
  }
}

export function stepPriority(step, overdue = false) {
  return (PRIORITY[step.key] ?? 50) - (overdue && step.owner !== 'done' ? 10 : 0)
}

/** Sorts videos most-urgent first using their next step (overdue first, then by priority, then deadline). */
export function byUrgency(a, b) {
  const pa = stepPriority(videoNextStep(a), a.overdue)
  const pb = stepPriority(videoNextStep(b), b.overdue)
  if (pa !== pb) return pa - pb
  return (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999')
}

/** Splits a project's videos by whose turn it is. */
export function groupByTurn(videos) {
  const groups = { admin: [], client: [], done: [] }
  for (const video of videos) groups[videoNextStep(video).owner].push(video)
  groups.admin.sort(byUrgency)
  groups.client.sort(byUrgency)
  return groups
}

/**
 * The single next step for a whole project (admin view).
 * `project` is the backend ProjectResponse; `videos` its VideoResponse list.
 */
export function projectNextStep(project, videos) {
  if (project.status === 'ARCHIVED') {
    return { key: 'archived', owner: 'done', title: 'This project is archived', detail: 'Restore it to continue working on it.', action: null }
  }
  if (videos.length === 0) {
    return {
      key: 'add-first-video', owner: 'admin',
      title: 'Add your first video',
      detail: 'Plan this month’s videos to start production.',
      action: { label: 'Add video', kind: 'add-video' },
      after: 'Each video starts as Pending until the client’s footage arrives.',
    }
  }
  const { admin, client, done } = groupByTurn(videos)
  if (admin.length > 0) {
    const video = admin[0]
    const step = videoNextStep(video)
    const others = admin.length - 1
    return {
      ...step,
      key: `video:${step.key}`,
      title: `${video.title}: ${step.title.charAt(0).toLowerCase()}${step.title.slice(1)}`,
      detail: `${step.detail}${others > 0 ? ` ${plural(others, 'more video')} also need${others === 1 ? 's' : ''} you.` : ''}`,
      video,
    }
  }
  const balance = Number(project.payment.balance)
  if (client.length === 0 && done.length === videos.length) {
    if (balance > 0) {
      return {
        key: 'record-payment', owner: 'admin',
        title: 'Record payment',
        detail: `All videos are delivered. ₹${balance.toLocaleString('en-IN')} is still outstanding.`,
        action: { label: 'Record payment', kind: 'record-payment' },
        after: 'The project shows as fully paid.',
      }
    }
    if (project.status === 'ACTIVE') {
      return {
        key: 'complete-project', owner: 'admin',
        title: 'Project is financially complete',
        detail: 'Every video is delivered and the fee is fully paid. Close it to move it out of active work.',
        action: { label: 'Mark project completed', kind: 'complete-project' },
        after: 'It moves out of your active work.',
      }
    }
    return { key: 'finished', owner: 'done', title: 'Project is financially complete', detail: 'Every video delivered and fully paid.', action: null }
  }
  const inReview = client.filter((v) => v.status === 'REVIEW').length
  return {
    key: 'waiting-on-client', owner: 'client',
    title: inReview > 0 ? 'Waiting for client review' : 'Waiting for raw footage',
    detail: inReview > 0
      ? `${plural(inReview, 'video')} with the client to approve or request changes. Nothing needs you right now.`
      : `${plural(client.length, 'video')} waiting for the client’s footage. Nothing needs you right now.`,
    action: null,
  }
}

/**
 * Admin "Today" queue across all work, built from existing endpoints:
 * pending inquiries, the video index (non-archived projects), active projects and payment rows.
 */
export function buildAttention({ inquiries = [], videoItems = [], activeProjects = [], paymentProjects = [] }) {
  const needsYou = []
  const waiting = []

  for (const inquiry of inquiries) {
    needsYou.push({
      id: `inquiry-${inquiry.id}`, kind: 'inquiry', priority: 0, overdue: false,
      title: `New inquiry from ${inquiry.name}`,
      context: `${inquiry.contentType} · ${inquiry.videosPerMonth} videos/month`,
      href: `/admin/inquiries?open=${inquiry.id}`, actionLabel: 'Review inquiry',
    })
  }

  for (const project of activeProjects) {
    if (project.videos.total === 0) {
      needsYou.push({
        id: `project-${project.id}`, kind: 'empty-project', priority: 5, overdue: false,
        title: `Add videos to ${project.name}`,
        context: project.clientName,
        href: `/admin/projects/${project.id}`, actionLabel: 'Open project',
      })
    }
  }

  for (const { video, projectName, clientName } of videoItems) {
    const step = videoNextStep(video)
    if (step.owner === 'done') continue
    const item = {
      id: `video-${video.id}`, kind: 'video', video, step,
      priority: stepPriority(step, video.overdue), overdue: video.overdue,
      title: video.title, context: `${clientName} · ${projectName}`,
      href: `/admin/videos/${video.id}`,
    }
    if (step.owner === 'admin') needsYou.push(item)
    else waiting.push(item)
  }

  for (const project of paymentProjects) {
    const balance = Number(project.payment.balance)
    const allDelivered = project.videos.total > 0 && project.videos.byStatus.DELIVERED === project.videos.total
    if (balance > 0 && allDelivered) {
      needsYou.push({
        id: `payment-${project.id}`, kind: 'payment', priority: 2.5, overdue: false,
        title: `Collect ₹${balance.toLocaleString('en-IN')} from ${project.clientName}`,
        context: `${project.name} · all videos delivered`,
        href: `/admin/projects/${project.id}`, actionLabel: 'Record payment',
      })
    }
  }

  needsYou.sort((a, b) => a.priority - b.priority)
  waiting.sort((a, b) => a.priority - b.priority)
  return { needsYou, waiting }
}

/**
 * Client view of a project: what the client needs to do and what is happening.
 * The client's actions: sending footage, approving a video in review or requesting a revision, and paying.
 */
export function clientSituation(project, videos) {
  const review = videos.filter((v) => v.status === 'REVIEW' && v.openRevisionCount === 0)
  const awaitingFootage = videos.filter((v) => v.status === 'PENDING')
  const inProduction = videos.filter((v) => ['MEDIA_RECEIVED', 'EDITING'].includes(v.status)
    || (v.status === 'REVIEW' && v.openRevisionCount > 0))
  const approved = videos.filter((v) => v.status === 'COMPLETED')
  const openChanges = videos.reduce((sum, v) => sum + (v.openRevisionCount ?? 0), 0)
  const delivered = videos.filter((v) => v.status === 'DELIVERED')
  const balance = Number(project?.payment?.balance ?? 0)

  let headline
  if (videos.length === 0) headline = 'Your editor is planning this month’s videos.'
  else if (delivered.length === videos.length) headline = 'Every video this month has been delivered.'
  else if (review.length > 0) headline = `${plural(review.length, 'video')} ready for your review.`
  else if (inProduction.length > 0) headline = `${plural(inProduction.length, 'video')} in production.`
  else if (approved.length > 0) headline = `${plural(approved.length, 'video')} approved — ready for delivery.`
  else headline = 'Waiting for your footage to begin.'

  return { review, awaitingFootage, inProduction, approved, delivered, openChanges, balance, headline }
}

/** What a video means for the client, in their words, and what (if anything) they should do. */
export function clientVideoStep(video) {
  const open = video.openRevisionCount ?? 0
  switch (video.status) {
    case 'PENDING':
      return { key: 'send-footage', owner: 'client', title: 'Waiting for your footage', detail: 'Share the raw footage with your editor on Google Drive. Editing starts as soon as it arrives.' }
    case 'MEDIA_RECEIVED':
    case 'EDITING':
      if (open > 0) {
        return { key: 'changes-in-progress', owner: 'admin', title: `Your editor is working on ${plural(open, 'change request')}`, detail: 'You’ll be able to review the updated cut here.' }
      }
      return { key: 'editing', owner: 'admin', title: 'Your editor is working on it', detail: 'You’ll see it here as ready for review when the cut is done.' }
    case 'REVIEW':
      return open > 0
        ? { key: 'changes-in-progress', owner: 'admin', title: `Your editor is working on ${plural(open, 'change request')}`, detail: 'You’ll be able to review the updated cut here.' }
        : { key: 'review', owner: 'client', title: 'Ready for your review', detail: 'Watch it, then approve it — or request a revision with the timecode of what to change.' }
    case 'COMPLETED':
      return { key: 'approved', owner: 'admin', title: 'Approved — ready for delivery', detail: 'Your editor will deliver the final video.' }
    case 'DELIVERED':
      return open > 0
        ? { key: 'changes-in-progress', owner: 'admin', title: `Your editor is looking at ${plural(open, 'change request')}`, detail: 'You asked for changes after delivery.' }
        : { key: 'delivered', owner: 'done', title: 'Delivered', detail: 'Download the final video from Drive.' }
    default:
      return { key: 'unknown', owner: 'done', title: '', detail: '' }
  }
}
