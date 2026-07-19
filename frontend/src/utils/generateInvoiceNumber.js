export function generateInvoiceNumber(flatNumber, month) {
  return `INV-${month}-${flatNumber}`;
}
