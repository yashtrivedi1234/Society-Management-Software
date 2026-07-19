export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const styles =
    toast.type === 'error'
      ? 'bg-red-600 text-white'
      : toast.type === 'warning'
        ? 'bg-amber-500 text-white'
        : 'bg-emerald-600 text-white';

  return (
    <div className="fixed top-4 right-4 z-[200]" role="status" aria-live="polite">
      <div className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${styles}`}>
        <div className="flex items-center gap-3">
          <span>{toast.message}</span>
          <button type="button" onClick={onClose} className="text-white/90 hover:text-white" aria-label="Dismiss notification">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
