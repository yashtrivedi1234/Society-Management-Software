export function isValidFlatNumber(value) {
  return /^[A-Z]-\d{3}$/i.test((value || '').trim());
}

export function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test((value || '').replace(/\D/g, ''));
}

export function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPositiveAmount(value) {
  return Number(value) > 0;
}
