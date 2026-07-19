const statusStyles = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-blue-100 text-blue-700',
};

const statusLabels = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
  partial: 'Partial',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
