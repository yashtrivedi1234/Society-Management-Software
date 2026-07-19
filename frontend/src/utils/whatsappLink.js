export function generateWhatsAppLink(phone, message) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
