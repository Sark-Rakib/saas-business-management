const ROLES = { USER: 'user', ADMIN: 'admin' };

const PLAN_TYPES = { FREE: 'free', PRO: 'pro', BUSINESS: 'business' };

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'bank', 'card', 'other'];

const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'refunded'];

const EXPENSE_CATEGORIES = [
  'rent', 'salary', 'electricity', 'internet', 'transport',
  'marketing', 'product_purchase', 'maintenance', 'software', 'other'
];

const INVESTMENT_TYPES = [
  'owner', 'partner', 'external', 'additional_capital'
];

const TRANSACTION_TYPES = [
  'sale', 'expense', 'investment', 'withdrawal',
  'purchase', 'income', 'refund', 'other'
];

const PAYMENT_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

const BUSINESS_TYPES = [
  'retail', 'wholesale', 'restaurant', 'services', 'manufacturing',
  'ecommerce', 'consulting', 'other'
];

const CURRENCIES = {
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', code: 'BDT' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', code: 'SAR' },
};

const FREE_PLAN_LIMITS = {
  products: 25,
  transactions: 100,
  customers: 15,
  suppliers: 15,
  advancedReports: false,
  pdfExport: false,
  advancedAnalytics: false,
};

const PRO_PLAN_LIMITS = {
  products: -1,
  transactions: -1,
  customers: -1,
  advancedReports: true,
  pdfExport: true,
  advancedAnalytics: true,
};

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: FREE_PLAN_LIMITS,
  },
  pro: {
    name: 'Pro',
    price: 499,
    limits: PRO_PLAN_LIMITS,
  },
};

module.exports = {
  ROLES, PLAN_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES,
  EXPENSE_CATEGORIES, INVESTMENT_TYPES, TRANSACTION_TYPES,
  PAYMENT_REQUEST_STATUSES, BUSINESS_TYPES, CURRENCIES,
  FREE_PLAN_LIMITS, PRO_PLAN_LIMITS, PLANS,
};
