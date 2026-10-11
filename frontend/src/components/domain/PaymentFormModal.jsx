import { paymentsApi } from '../../api/payments'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { formatMoney, todayIso } from '../../utils/format'
import { Button } from '../ui/Button'
import { FormError, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { parseAmount, validatePayment } from '../../utils/validation'

/**
 * Records a UPI payment. The overpayment and future-date rules are enforced by the backend;
 * its message is shown here if the payment is rejected.
 */
export function PaymentFormModal({ open, onClose, projectId, balance, onSaved }) {
  const toast = useToast()
  const form = useForm({ amount: '', paymentDate: todayIso(), note: '' }, {
    validate: validatePayment,
    onSubmit: async (v) => {
      await paymentsApi.record(projectId, { amount: parseAmount(v.amount), paymentDate: v.paymentDate, note: v.note.trim() || null })
      toast.success(`Payment of ${formatMoney(parseAmount(v.amount))} recorded`)
      onSaved?.()
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Record payment"
      description={balance !== undefined ? `Remaining balance: ${formatMoney(balance)}` : undefined}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="payment-form" loading={form.submitting}>Record payment</Button>
        </>
      )}
    >
      <form id="payment-form" onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <TextField label="Amount (₹)" type="text" inputMode="decimal" placeholder="11,000" autoComplete="off" {...form.field('amount')} />
        <TextField label="Payment date" type="date" max={todayIso()} {...form.field('paymentDate')} />
        <TextField label="Note" optional placeholder="UPI reference, installment…" {...form.field('note')} />
        <FormError message={form.formError} />
      </form>
    </Modal>
  )
}
