// Shared input validators for user-supplied values that flow into Mongo queries.

const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;

export function isYearMonth(value) {
  return typeof value === 'string' && YEAR_MONTH_RE.test(value);
}

// Returns the value only if it's a valid YYYY-MM string, else the fallback.
// Use before interpolating a month into a $regex to prevent ReDoS / filter-bypass (e.g. ?month=.*).
export function safeYearMonth(value, fallback = null) {
  return isYearMonth(value) ? value : fallback;
}
