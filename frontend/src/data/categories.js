export const expenseCategories = [
  { id: "security", label: "Security", color: "#8B5CF6", icon: "Shield" },
  { id: "utilities", label: "Utilities", color: "#F59E0B", icon: "Zap" },
  { id: "repairs", label: "Repairs", color: "#EF4444", icon: "Wrench" },
  { id: "maintenance", label: "Maintenance", color: "#3B82F6", icon: "Settings" },
  { id: "events", label: "Events", color: "#EC4899", icon: "PartyPopper" },
  { id: "gardening", label: "Gardening", color: "#10B981", icon: "TreePine" },
  { id: "administrative", label: "Administrative", color: "#6B7280", icon: "FileText" },
  { id: "miscellaneous", label: "Miscellaneous", color: "#78716C", icon: "MoreHorizontal" },
];

export function getCategoryById(id) {
  return expenseCategories.find(c => c.id === id) || expenseCategories[expenseCategories.length - 1];
}
