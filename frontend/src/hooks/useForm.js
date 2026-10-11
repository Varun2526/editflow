import { useState } from 'react'
import { toApiError } from '../api/errors'

/**
 * Small form helper: field values, client-side checks for obvious mistakes, and mapping of the
 * backend's field errors / message onto the form. The backend's validation remains authoritative.
 */
export function useForm(initialValues, { validate, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const field = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (event) => {
      const { type, checked, value } = event.target
      setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
    },
  })

  async function handleSubmit(event) {
    event?.preventDefault()
    const clientErrors = validate ? validate(values) : {}
    const hasClientErrors = Object.values(clientErrors).some(Boolean)
    setErrors(clientErrors)
    setFormError(null)
    if (hasClientErrors) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0
      setErrors(apiError.fieldErrors)
      setFormError(hasFieldErrors && apiError.status === 400 ? null : apiError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return { values, setValues, errors, formError, submitting, field, handleSubmit }
}
