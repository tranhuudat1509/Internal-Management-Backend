export type PaymentStatus =
    | 'UNPAID'
    | 'PARTIALLY_PAID'
    | 'PAID';

export function calculateOrderFinancialSummary(
    total: number,
    payments: { amount: number }[],
) {
    const amountPaid = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );

    const remainingBalance = total - amountPaid;

    let paymentStatus: PaymentStatus = 'UNPAID';

    if (amountPaid === 0) {
        paymentStatus = 'UNPAID';
    } else if (remainingBalance === 0) {
        paymentStatus = 'PAID';
    } else {
        paymentStatus = 'PARTIALLY_PAID';
    }

    return {
        amountPaid,
        remainingBalance,
        paymentStatus,
    };
}