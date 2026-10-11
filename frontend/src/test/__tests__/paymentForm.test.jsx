import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFailure, renderWithProviders } from '../helpers'
import { PaymentFormModal } from '../../components/domain/PaymentFormModal'

vi.mock('../../api/auth', () => ({ authApi: { me: vi.fn() } }))
vi.mock('../../api/payments', () => ({ paymentsApi: { record: vi.fn() } }))
const { paymentsApi } = await import('../../api/payments')

function renderForm(props = {}) {
  return renderWithProviders(<PaymentFormModal open projectId={3} balance="10000.00" onClose={vi.fn()} {...props} />)
}

describe('PaymentFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects zero before calling the API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Amount (₹)'), '0')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(screen.getByText('Enter an amount greater than ₹0 (up to 2 decimals)')).toBeInTheDocument()
    expect(paymentsApi.record).not.toHaveBeenCalled()
  })

  it('records a valid payment as numbers and refreshes', async () => {
    paymentsApi.record.mockResolvedValue({ id: 1 })
    const onSaved = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderForm({ onSaved, onClose })

    await user.type(screen.getByLabelText('Amount (₹)'), '10000')
    await user.type(screen.getByLabelText(/Note/), 'UPI ref 4411')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    await waitFor(() => expect(paymentsApi.record).toHaveBeenCalledWith(3, expect.objectContaining({ amount: 10000, note: 'UPI ref 4411' })))
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('accepts Indian-formatted amounts like 11,000', async () => {
    paymentsApi.record.mockResolvedValue({ id: 2 })
    const user = userEvent.setup()
    renderForm({ balance: '11000.00' })

    await user.type(screen.getByLabelText('Amount (₹)'), '11,000')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    await waitFor(() => expect(paymentsApi.record).toHaveBeenCalledWith(3, expect.objectContaining({ amount: 11000 })))
  })

  it('shows the backend overpayment message and stays open', async () => {
    paymentsApi.record.mockRejectedValue(apiFailure(400, { message: 'Payment of 15000.00 exceeds the remaining balance of 10000.00' }))
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderForm({ onClose })

    await user.type(screen.getByLabelText('Amount (₹)'), '15000')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('exceeds the remaining balance of 10000.00')
    expect(onClose).not.toHaveBeenCalled()
  })
})
