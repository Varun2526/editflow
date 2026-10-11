const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Client-side checks for obvious mistakes only, so users get instant feedback.
 * The backend validates everything again and its field errors are shown when it disagrees.
 */
export function isEmail(value) {
  return EMAIL.test(value.trim())
}

/** Field names mirror the backend InquiryRequest DTO so server errors map onto the same fields. */
export function validateInquiry(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name'
  if (!isEmail(values.email)) errors.email = 'Please enter a valid email address'
  if (!values.phoneOrInstagram.trim()) errors.phoneOrInstagram = 'Add a phone number or Instagram handle'
  if (values.contentTypes.length === 0) errors.contentType = 'Choose at least one type of content'
  const videos = Number(values.videosPerMonth)
  if (!Number.isInteger(videos) || videos < 1) errors.videosPerMonth = 'Enter how many videos per month (at least 1)'
  if (values.budget === '' || Number(values.budget) < 0) errors.budget = 'Enter your monthly budget (₹0 or more)'
  return errors
}

/** "11,000", "₹ 11,000.50" → 11000 / 11000.5; anything else → NaN. */
export function parseAmount(raw) {
  const cleaned = String(raw ?? '').replace(/[₹,\s]/g, '')
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : Number.NaN
}

export function validatePayment(values) {
  const amount = parseAmount(values.amount)
  return {
    amount: amount > 0 ? undefined : 'Enter an amount greater than ₹0 (up to 2 decimals)',
    paymentDate: values.paymentDate ? undefined : 'Choose the payment date',
  }
}
