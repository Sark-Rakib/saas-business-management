export const CURRENCIES = {
  BDT: { symbol: "৳", name: "Bangladeshi Taka" },
  USD: { symbol: "$", name: "US Dollar" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  AED: { symbol: "د.إ", name: "UAE Dirham" },
  SAR: { symbol: "﷼", name: "Saudi Riyal" },
};

export const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "services", label: "Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "consulting", label: "Consulting" },
  { value: "clothing", label: "Clothing Brand" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "refunded", label: "Refunded" },
];

export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "salary", label: "Salary" },
  { value: "electricity", label: "Electricity" },
  { value: "internet", label: "Internet" },
  { value: "transport", label: "Transport" },
  { value: "marketing", label: "Marketing" },
  { value: "product_purchase", label: "Product Purchase" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

export const INVESTMENT_TYPES = [
  { value: "owner", label: "Owner Investment" },
  { value: "partner", label: "Partner Investment" },
  { value: "external", label: "External Investment" },
  { value: "additional_capital", label: "Additional Capital" },
];

export const TRANSACTION_TYPES = [
  { value: "sale", label: "Sale" },
  { value: "expense", label: "Expense" },
  { value: "investment", label: "Investment" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "purchase", label: "Purchase" },
  { value: "income", label: "Income" },
  { value: "refund", label: "Refund" },
  { value: "other", label: "Other" },
];

export const NAVIGATION = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/sales", label: "Sales", icon: "sales" },
  { href: "/dashboard/purchases", label: "Purchases", icon: "purchases" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "expenses" },
  { href: "/dashboard/investments", label: "Investments", icon: "investments" },
  { href: "/dashboard/products", label: "Products", icon: "products" },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: "suppliers" },
  { href: "/dashboard/customers", label: "Customers", icon: "customers" },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: "transactions",
  },
  { href: "/dashboard/reports", label: "Reports", icon: "reports" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { href: "/dashboard/settings", label: "Business Settings", icon: "settings" },
  {
    href: "/dashboard/subscription",
    label: "Subscription",
    icon: "subscription",
  },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
];

export const formatMoney = (amount, currencyCode = "BDT") => {
  const symbol = CURRENCIES[currencyCode]?.symbol || "৳";
  if (amount === null || amount === undefined || isNaN(amount))
    return `${symbol}0`;
  return `${symbol}${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date, withTime = false) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const capitalize = (str = "") => {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
