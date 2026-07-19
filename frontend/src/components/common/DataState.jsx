export default function DataState({
  loading,
  error,
  empty,
  emptyMessage = 'No records found',
  onRetry,
}) {
  if (loading) {
    return (
      <div className="text-center py-10 text-sm text-gray-500">
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center py-10 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return null;
}
