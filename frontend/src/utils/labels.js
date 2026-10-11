/** Display labels for backend enums. Business rules stay on the backend; this is presentation only. */

export const VIDEO_STATUSES = ['PENDING', 'MEDIA_RECEIVED', 'EDITING', 'REVIEW', 'COMPLETED', 'DELIVERED']

export const VIDEO_STATUS_LABEL = {
  PENDING: 'Pending',
  MEDIA_RECEIVED: 'Media received',
  EDITING: 'Editing',
  REVIEW: 'In review',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
}

export const CONTENT_TYPES = ['REEL', 'YOUTUBE_SHORT', 'YOUTUBE_VIDEO', 'PODCAST']

export const CONTENT_TYPE_LABEL = {
  REEL: 'Reel',
  YOUTUBE_SHORT: 'YouTube Short',
  YOUTUBE_VIDEO: 'YouTube video',
  PODCAST: 'Podcast',
}

export const PAYMENT_STATUS_LABEL = { UNPAID: 'Unpaid', PARTIALLY_PAID: 'Partially paid', PAID: 'Paid' }
export const PROJECT_STATUS_LABEL = { ACTIVE: 'Active', COMPLETED: 'Completed', ARCHIVED: 'Archived' }
export const INQUIRY_STATUS_LABEL = { PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Rejected' }
export const REVISION_STATUS_LABEL = { OPEN: 'Open', RESOLVED: 'Resolved' }

/**
 * Button label for a transition the backend says is allowed. Whether a move is forward or a
 * correction is read from the status order; which moves exist is decided by the backend.
 */
export function transitionLabel(from, to) {
  if (isForward(from, to)) {
    return {
      MEDIA_RECEIVED: 'Media received',
      EDITING: 'Start editing',
      REVIEW: 'Send to review',
      COMPLETED: 'Mark completed',
      DELIVERED: 'Deliver',
    }[to]
  }
  if (from === 'DELIVERED') return 'Reopen for editing'
  if (from === 'REVIEW') return 'Request changes'
  if (from === 'MEDIA_RECEIVED') return 'Undo media received'
  return `Back to ${VIDEO_STATUS_LABEL[to].toLowerCase()}`
}

export function isForward(from, to) {
  return VIDEO_STATUSES.indexOf(to) > VIDEO_STATUSES.indexOf(from)
}
