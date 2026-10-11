import { Badge } from './Badge'
import {
  INQUIRY_STATUS_LABEL, PAYMENT_STATUS_LABEL, PROJECT_STATUS_LABEL, REVISION_STATUS_LABEL, VIDEO_STATUS_LABEL,
} from '../../utils/labels'

const VIDEO_TONE = {
  PENDING: 'neutral', MEDIA_RECEIVED: 'blue', EDITING: 'yellow', REVIEW: 'violet', COMPLETED: 'green', DELIVERED: 'dark',
}

export function VideoStatusBadge({ status }) {
  return <Badge tone={VIDEO_TONE[status]} dot animateKey={status}>{VIDEO_STATUS_LABEL[status]}</Badge>
}

export function PaymentStatusBadge({ status }) {
  const tone = { UNPAID: 'red', PARTIALLY_PAID: 'yellow', PAID: 'green' }[status]
  return <Badge tone={tone} animateKey={status}>{PAYMENT_STATUS_LABEL[status]}</Badge>
}

export function ProjectStatusBadge({ status }) {
  const tone = { ACTIVE: 'blue', COMPLETED: 'green', ARCHIVED: 'neutral' }[status]
  return <Badge tone={tone} animateKey={status}>{PROJECT_STATUS_LABEL[status]}</Badge>
}

export function InquiryStatusBadge({ status }) {
  const tone = { PENDING: 'yellow', ACCEPTED: 'green', REJECTED: 'neutral' }[status]
  return <Badge tone={tone}>{INQUIRY_STATUS_LABEL[status]}</Badge>
}

export function RevisionStatusBadge({ status }) {
  return <Badge tone={status === 'OPEN' ? 'yellow' : 'green'} animateKey={status}>{REVISION_STATUS_LABEL[status]}</Badge>
}

export function OverdueBadge() {
  return <Badge tone="red">Overdue</Badge>
}
