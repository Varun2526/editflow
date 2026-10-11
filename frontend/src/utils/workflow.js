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
        title: 'Footage is in — start editing',
        detail: 'Raw media has been received.',
        action: { label: 'Start editing', transition: 'EDITING' },
        after: 'The video moves to Editing.',
      }
    case 'EDITING':
      return {
        key: 'send-to-review', owner: 'admin',
        title: 'Editing in progress',
        detail: 'Send it to the client when the cut is ready.',
        action: { label: 'Send to review', transition: 'REVIEW' },
        after: 'The client sees it as ready for their review.',
      }
    case 'REVIEW':
      return open > 0
        ? {
          key: 'resolve-revisions', owner: 'admin',
          title: `${plural(open, 'change request')} to address`,
          detail: 'The client left timestamped feedback.',
          action: { label: 'Review changes', open: true },
          after: 'Resolve each request, then mark the video completed.',
        }
        : {
          key: 'awaiting-review', owner: 'client',
          title: 'With the client for review',
          detail: 'Waiting for the client’s feedback.',
          action: { label: 'Mark completed', transition: 'COMPLETED' },
          after: 'Once approved it’s ready to deliver.',
        }
    case 'COMPLETED':
      return {
        key: 'deliver', owner: 'admin',
        title: 'Approved — ready to deliver',
        detail: 'The final cut is done.',
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
      title: 'Add the first video',
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
        title: 'All videos delivered — collect the balance',
        detail: `₹${balance.toLocaleString('en-IN')} is still outstanding.`,
        action: { label: 'Record payment', kind: 'record-payment' },
        after: 'The project shows as fully paid.',
      }
    }
    if (project.status === 'ACTIVE') {
      return {
        key: 'complete-project', owner: 'admin',
        title: 'Delivered and paid — close the project',
        detail: 'Every video is delivered and the fee is fully paid.',
        action: { label: 'Mark project completed', kind: 'complete-project' },
        after: 'It moves out of your active work.',
      }
    }
    return { key: 'finished', owner: 'done', title: 'Project complete', detail: 'Delivered and fully paid.', action: null }
  }
  return {
    key: 'waiting-on-client', owner: 'client',
    title: 'Waiting on the client',
    detail: `${plural(client.length, 'video')} waiting for footage or review. Nothing needs you right now.`,
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
 * Clients never change status; their actions are reviewing (leaving feedback), sending footage and paying.
 */
export function clientSituation(project, videos) {
  const review = videos.filter((v) => v.status === 'REVIEW' && v.openRevisionCount === 0)
  const awaitingFootage = videos.filter((v) => v.status === 'PENDING')
  const inProduction = videos.filter((v) => ['MEDIA_RECEIVED', 'EDITING', 'COMPLETED'].includes(v.status)
    || (v.status === 'REVIEW' && v.openRevisionCount > 0))
  const openChanges = videos.reduce((sum, v) => sum + (v.openRevisionCount ?? 0), 0)
  const delivered = videos.filter((v) => v.status === 'DELIVERED')
  const balance = Number(project?.payment?.balance ?? 0)

  let headline
  if (videos.length === 0) headline = 'Your editor is planning this month’s videos.'
  else if (delivered.length === videos.length) headline = 'Every video this month has been delivered.'
  else if (review.length > 0) headline = `${plural(review.length, 'video')} ready for your review.`
  else if (inProduction.length > 0) headline = `${plural(inProduction.length, 'video')} in production.`
  else headline = 'Waiting for your footage to begin.'

  return { review, awaitingFootage, inProduction, delivered, openChanges, balance, headline }
}

/** What a video means for the client, in their words, and what (if anything) they should do. */
export function clientVideoStep(video) {
  const open = video.openRevisionCount ?? 0
  switch (video.status) {
    case 'PENDING':
      return { key: 'send-footage', owner: 'client', title: 'Waiting for your footage', detail: 'Share the raw footage with your editor on Google Drive. Editing starts as soon as it arrives.' }
    case 'MEDIA_RECEIVED':
    case 'EDITING':
      return { key: 'editing', owner: 'admin', title: 'Your editor is working on it', detail: 'You’ll see it here as ready for review when the cut is done.' }
    case 'REVIEW':
      return open > 0
        ? { key: 'changes-in-progress', owner: 'admin', title: `Your editor is working on ${plural(open, 'change request')}`, detail: 'You’ll be able to review the updated cut here.' }
        : { key: 'review', owner: 'client', title: 'Ready for your review', detail: 'Watch it on Drive. Something to change? Leave a note with the timecode. Happy with it? Nothing to do — your editor will finalize it.' }
    case 'COMPLETED':
      return { key: 'finalizing', owner: 'admin', title: 'Approved — delivery coming', detail: 'The final cut is done and will be delivered shortly.' }
    case 'DELIVERED':
      return open > 0
        ? { key: 'changes-in-progress', owner: 'admin', title: `Your editor is looking at ${plural(open, 'change request')}`, detail: 'You asked for changes after delivery.' }
        : { key: 'delivered', owner: 'done', title: 'Delivered', detail: 'Download the final video from Drive.' }
    default:
      return { key: 'unknown', owner: 'done', title: '', detail: '' }
  }
}
