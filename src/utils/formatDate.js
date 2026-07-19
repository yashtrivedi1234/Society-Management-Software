import { format, parseISO } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMMM yyyy');
}

export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthsList(count = 6) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(format(d, 'yyyy-MM'));
  }
  return months;
}
