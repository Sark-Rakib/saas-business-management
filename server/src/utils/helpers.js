const { CURRENCIES } = require('./constants');

const generateSKU = (name, index) => {
  const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  return `${prefix}-${String(index).padStart(4, '0')}`;
};

const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = parseLocalDate(startDate);
    if (endDate) {
      const end = parseLocalDate(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  return filter;
};

const parseLocalDate = (value) => {
  if (value instanceof Date) return new Date(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  if (value) return new Date(value);
  return new Date();
};

const formatCurrency = (amount, currencyCode = 'BDT') => {
  const symbol = (CURRENCIES[currencyCode] || CURRENCIES.BDT).symbol;
  return `${symbol}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

module.exports = { generateSKU, paginate, buildDateFilter, parseLocalDate, formatCurrency };
