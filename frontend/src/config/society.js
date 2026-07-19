const societyConfig = {
  name: "Green Valley Residency",
  shortName: "GVR",
  area: "Sector 42",
  city: "Gurugram",
  state: "Haryana",
  pincode: "122001",
  fullAddress: "Green Valley Residency, Sector 42, Gurugram, Haryana - 122001",

  phone: "+91 98108 45632",
  email: "admin@greenvalleyresidency.in",

  currency: "INR",
  currencySymbol: "\u20B9",
  monthlyMaintenance: 3500,
  lateFeePerDay: 50,
  maintenanceDueDay: 10,

  totalFlats: 48,
  blocks: ["A", "B", "C"],
  flatsPerBlock: 16,

  primaryColor: "#0F766E",
  accentColor: "#0369A1",

  bankName: "HDFC Bank",
  accountNumber: "50100287456321",
  ifscCode: "HDFC0001234",
  accountName: "Green Valley Residency RWA",
  upiId: "greenvalley@hdfcbank",

  productName: "Society Manager",
  productTagline: "Complete RWA & Society Operations",

  financialYearStart: 4,

  whatsappTemplate: (name, amount, month, flatNumber, upiId) =>
    `Dear ${name} ji,\n\nThis is a gentle reminder from Green Valley Residency that your maintenance of \u20B9${amount.toLocaleString('en-IN')} for ${month} (Flat ${flatNumber}) is pending.\n\nPlease pay at your earliest convenience.\nUPI: ${upiId}\n\nThank you.\n- Green Valley RWA`,
};

export default societyConfig;
