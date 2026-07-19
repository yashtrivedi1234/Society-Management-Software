// Sets a FALLBACK tenant for public/unauthenticated routes only (e.g. health checks).
// For any authenticated route, requireAuth overrides req.societyId with the user's own
// societyId, so the x-society-id header below can never be used to read another tenant's data.
export function attachSocietyContext(req, _res, next) {
  const headerSociety = req.headers['x-society-id'];
  const societyId = typeof headerSociety === 'string' && headerSociety.trim() ? headerSociety.trim() : 'default';
  req.societyId = societyId;
  next();
}
