require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Seeding...');

    await Promise.all([
      User.deleteMany({}), Business.deleteMany({}), Subscription.deleteMany({}),
      Product.deleteMany({}), Sale.deleteMany({}), Expense.deleteMany({}),
      Investment.deleteMany({}), Customer.deleteMany({}), Transaction.deleteMany({}),
      Supplier.deleteMany({}), Purchase.deleteMany({}),
    ]);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@businesshub.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
    });

    console.log('Admin created:', admin.email, '/ admin123');

    const demoPassword = 'demo1234';
    const demoUser = await User.create({
      name: 'Rakib Hasan',
      email: 'demo@businesshub.com',
      phone: '01700000000',
      password: demoPassword,
      isVerified: true,
    });

    const demoBusiness = await Business.create({
      userId: demoUser._id,
      name: 'Demo Store',
      type: 'retail',
      currency: 'BDT',
      address: 'Dhaka, Bangladesh',
      phone: '01700000000',
      startingCapital: 100000,
      isOnboarded: true,
    });

    demoUser.businessId = demoBusiness._id;
    await demoUser.save();

    await Subscription.create({
      userId: demoUser._id,
      businessId: demoBusiness._id,
      plan: 'pro',
      status: 'active',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const products = await Product.create([
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Premium Cotton Shirt', sku: 'CS-0001', category: 'Apparel', purchasePrice: 700, sellingPrice: 1200, stock: 50, lowStockWarning: 10 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Classic Denim Jeans', sku: 'DJ-0002', category: 'Apparel', purchasePrice: 950, sellingPrice: 1600, stock: 30, lowStockWarning: 8 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Leather Wallet', sku: 'LW-0003', category: 'Accessories', purchasePrice: 400, sellingPrice: 850, stock: 5, lowStockWarning: 5 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Smart Watch', sku: 'SW-0004', category: 'Electronics', purchasePrice: 2500, sellingPrice: 4200, stock: 15, lowStockWarning: 5 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Wireless Earbuds', sku: 'WE-0005', category: 'Electronics', purchasePrice: 1200, sellingPrice: 2200, stock: 0, lowStockWarning: 10 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Sports Shoes', sku: 'SS-0006', category: 'Footwear', purchasePrice: 1800, sellingPrice: 3200, stock: 20, lowStockWarning: 5 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Backpack', sku: 'BP-0007', category: 'Accessories', purchasePrice: 800, sellingPrice: 1500, stock: 12, lowStockWarning: 4 },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Office Chair', sku: 'OC-0008', category: 'Furniture', purchasePrice: 5000, sellingPrice: 8500, stock: 8, lowStockWarning: 3 },
    ]);

    const customers = await Customer.create([
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Ahmed Khan', phone: '01810000001', email: 'ahmed@example.com', address: 'Gulshan, Dhaka' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Fatima Rahman', phone: '01810000002', email: 'fatima@example.com', address: 'Uttara, Dhaka' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Shakil Ahmed', phone: '01810000003', email: 'shakil@example.com', address: 'Motijheel, Dhaka' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Nusrat Jahan', phone: '01810000004', email: 'nusrat@example.com', address: 'Mirpur, Dhaka' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Tanvir Hossain', phone: '01810000005', email: 'tanvir@example.com', address: 'Dhanmondi, Dhaka' },
    ]);

    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const seedSales = [
      { d: 1, customer: customers[0], items: [{ p: products[0], q: 2, sp: 1200 }, { p: products[1], q: 1, sp: 1600 }], pm: 'bkash', note: 'Walk-in purchase' },
      { d: 2, customer: customers[1], items: [{ p: products[2], q: 3, sp: 850 }], pm: 'cash', note: '' },
      { d: 3, customer: customers[2], items: [{ p: products[3], q: 1, sp: 4200 }, { p: products[6], q: 2, sp: 1500 }], pm: 'nagad', note: 'Bulk order' },
      { d: 4, customer: customers[3], items: [{ p: products[5], q: 1, sp: 3200 }], pm: 'card', note: '' },
      { d: 5, customer: customers[0], items: [{ p: products[0], q: 3, sp: 1200 }], pm: 'bkash', note: 'Repeat customer' },
      { d: 7, customer: customers[4], items: [{ p: products[4], q: 2, sp: 2200 }, { p: products[2], q: 1, sp: 850 }], pm: 'cash', note: '' },
      { d: 9, customer: customers[1], items: [{ p: products[7], q: 1, sp: 8500 }], pm: 'bank', note: 'Office furniture' },
      { d: 12, customer: customers[2], items: [{ p: products[3], q: 2, sp: 4200 }], pm: 'bkash', note: '' },
      { d: 15, customer: customers[3], items: [{ p: products[6], q: 1, sp: 1500 }, { p: products[5], q: 1, sp: 3200 }], pm: 'cash', note: '' },
      { d: 18, customer: customers[0], items: [{ p: products[0], q: 4, sp: 1200 }, { p: products[1], q: 2, sp: 1600 }], pm: 'nagad', note: 'Wholesale order' },
      { d: 22, customer: customers[4], items: [{ p: products[2], q: 5, sp: 850 }], pm: 'cash', note: '' },
      { d: 26, customer: customers[1], items: [{ p: products[7], q: 2, sp: 8500 }, { p: products[3], q: 1, sp: 4200 }], pm: 'bank', note: 'Corporate order' },
      { d: 29, customer: customers[2], items: [{ p: products[0], q: 2, sp: 1200 }], pm: 'bkash', note: '' },
      { d: 33, customer: customers[3], items: [{ p: products[5], q: 3, sp: 3200 }], pm: 'card', note: '' },
      { d: 38, customer: customers[0], items: [{ p: products[1], q: 1, sp: 1600 }, { p: products[4], q: 1, sp: 2200 }], pm: 'bkash', note: '' },
      { d: 45, customer: customers[4], items: [{ p: products[6], q: 4, sp: 1500 }], pm: 'cash', note: 'Bulk order' },
    ];

    let saleNumber = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const seedSale of seedSales) {
      saleNumber++;
      let subtotal = 0;
      let totalCost = 0;
      const items = [];

      for (const item of seedSale.items) {
        subtotal += item.q * item.sp;
        totalCost += item.q * item.p.purchasePrice;
        items.push({
          product: item.p._id,
          productName: item.p.name,
          quantity: item.q,
          sellingPrice: item.sp,
          purchasePrice: item.p.purchasePrice,
          discount: 0,
          total: item.q * item.sp,
        });
      }

      const saleDate = daysAgo(seedSale.d);
      const paid = subtotal;
      const sale = await Sale.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        customer: seedSale.customer._id,
        customerName: seedSale.customer.name,
        items,
        subtotal,
        totalDiscount: 0,
        totalAmount: subtotal,
        totalCost,
        totalProfit: subtotal - totalCost,
        paymentMethod: seedSale.pm,
        paymentStatus: 'paid',
        amountPaid: paid,
        dueAmount: 0,
        date: saleDate,
        note: seedSale.note,
        invoiceNumber: `INV-2026-${String(saleNumber).padStart(5, '0')}`,
      });

      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }

      const cust = await Customer.findById(seedSale.customer._id);
      cust.totalPurchases = (cust.totalPurchases || 0) + subtotal;
      cust.totalPaid = (cust.totalPaid || 0) + paid;
      cust.dueAmount = Math.max(0, cust.totalPurchases - cust.totalPaid);
      await cust.save();

      await Transaction.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        type: 'sale',
        amount: paid,
        paymentMethod: seedSale.pm,
        date: saleDate,
        description: `Sale - Invoice ${sale.invoiceNumber}`,
        reference: sale.invoiceNumber,
        entityType: 'sale',
        entityId: sale._id,
      });
    }

    const seedExpenses = [
      { title: 'Shop Rent', category: 'rent', amount: 25000, day: 2 },
      { title: 'Staff Salary - January', category: 'salary', amount: 45000, day: 5 },
      { title: 'Electricity Bill', category: 'electricity', amount: 8200, day: 8 },
      { title: 'Internet Bill', category: 'internet', amount: 1500, day: 10 },
      { title: 'Delivery Transport', category: 'transport', amount: 3200, day: 12 },
      { title: 'Facebook Ads', category: 'marketing', amount: 5000, day: 15 },
      { title: 'New Product Purchase', category: 'product_purchase', amount: 35000, day: 18 },
      { title: 'AC Maintenance', category: 'maintenance', amount: 4500, day: 20 },
      { title: 'POS Software Subscription', category: 'software', amount: 2000, day: 22 },
      { title: 'Office Supplies', category: 'other', amount: 1800, day: 25 },
      { title: 'Staff Salary - February', category: 'salary', amount: 45000, day: 28 },
      { title: 'Electricity Bill (2nd)', category: 'electricity', amount: 7800, day: 32 },
      { title: 'UTTARA Warehouse Rent', category: 'rent', amount: 12000, day: 35 },
      { title: 'Packaging Materials', category: 'product_purchase', amount: 6000, day: 40 },
      { title: 'License Renewal', category: 'other', amount: 3500, day: 44 },
    ];

    for (const exp of seedExpenses) {
      const expense = await Expense.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        paymentMethod: 'cash',
        date: daysAgo(exp.day),
      });

      await Transaction.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        type: 'expense',
        amount: exp.amount,
        paymentMethod: 'cash',
        date: daysAgo(exp.day),
        description: `Expense - ${exp.title}`,
        reference: exp.title,
        entityType: 'expense',
        entityId: expense._id,
      });
    }

    const seedInvestments = [
      { title: 'Initial Capital', amount: 100000, source: 'Owner', type: 'owner', day: 60 },
      { title: 'Partner Investment', amount: 50000, source: 'Partner', type: 'partner', day: 40 },
      { title: 'Additional Stock Funding', amount: 30000, source: 'Owner', type: 'additional_capital', day: 20 },
    ];

    for (const inv of seedInvestments) {
      const investment = await Investment.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        title: inv.title,
        amount: inv.amount,
        source: inv.source,
        type: inv.type,
        date: daysAgo(inv.day),
      });

      await Transaction.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        type: 'investment',
        amount: inv.amount,
        paymentMethod: 'other',
        date: daysAgo(inv.day),
        description: `Investment - ${inv.title}`,
        reference: inv.source || inv.title,
        entityType: 'investment',
        entityId: investment._id,
      });
    }

    const suppliers = await Supplier.create([
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Karim Traders', company: 'Karim Traders Ltd', phone: '01720000001', email: 'karim@example.com', address: 'Karwan Bazar, Dhaka', notes: 'Main clothing supplier' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Rahman Electronics', company: 'Rahman Electronics', phone: '01720000002', email: 'rahman@example.com', address: 'Eskaton, Dhaka', notes: 'Electronics distributor' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Mia & Sons Footwear', company: 'Mia & Sons', phone: '01720000003', email: 'mia@example.com', address: 'Islampur, Dhaka', notes: '' },
      { businessId: demoBusiness._id, userId: demoUser._id, name: 'Global Furniture BD', company: 'Global Furniture Ltd', phone: '01720000004', email: 'global@example.com', address: 'Tejgaon, Dhaka', notes: 'Office furniture' },
    ]);

    const seedPurchases = [
      { d: 3, supplier: suppliers[0], items: [{ p: products[0], q: 30, pp: 700 }, { p: products[1], q: 20, pp: 950 }], pm: 'bank', note: 'Monthly stock' },
      { d: 10, supplier: suppliers[1], items: [{ p: products[3], q: 10, pp: 2500 }, { p: products[4], q: 15, pp: 1200 }], pm: 'bank', note: '' },
      { d: 17, supplier: suppliers[2], items: [{ p: products[5], q: 25, pp: 1800 }], pm: 'cash', note: 'New season' },
      { d: 24, supplier: suppliers[3], items: [{ p: products[7], q: 6, pp: 5000 }], pm: 'bkash', note: 'Office chairs' },
      { d: 31, supplier: suppliers[0], items: [{ p: products[0], q: 25, pp: 700 }, { p: products[2], q: 30, pp: 400 }], pm: 'bank', note: '' },
      { d: 40, supplier: suppliers[1], items: [{ p: products[3], q: 8, pp: 2500 }, { p: products[4], q: 10, pp: 1200 }], pm: 'cash', note: '' },
    ];

    let purchaseNumber = 0;
    for (const seedPurchase of seedPurchases) {
      purchaseNumber++;
      let subtotal = 0;
      const items = [];
      for (const item of seedPurchase.items) {
        items.push({
          product: item.p._id,
          productName: item.p.name,
          quantity: item.q,
          purchasePrice: item.pp,
          sellingPrice: item.p.sellingPrice,
          total: item.q * item.pp,
        });
        subtotal += item.q * item.pp;
        await Product.findByIdAndUpdate(item.p._id, { $inc: { stock: item.q } });
      }

      const purchaseDate = daysAgo(seedPurchase.d);
      const dueAmount = purchaseNumber % 2 === 0 ? subtotal * 0.3 : 0;
      const amountPaid = Math.round(subtotal - dueAmount);

      const purchase = await Purchase.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        supplier: seedPurchase.supplier._id,
        supplierName: seedPurchase.supplier.name,
        items,
        subtotal,
        totalDiscount: 0,
        totalAmount: subtotal,
        totalCost: subtotal,
        paymentMethod: seedPurchase.pm,
        paymentStatus: dueAmount > 0 ? 'partial' : 'paid',
        amountPaid,
        dueAmount,
        date: purchaseDate,
        note: seedPurchase.note,
        invoiceNumber: `PUR-2026-${String(purchaseNumber).padStart(5, '0')}`,
      });

      const sup = await Supplier.findById(seedPurchase.supplier._id);
      sup.totalPurchases = (sup.totalPurchases || 0) + subtotal;
      sup.totalPaid = (sup.totalPaid || 0) + amountPaid;
      sup.dueAmount = Math.max(0, sup.totalPurchases - sup.totalPaid);
      await sup.save();

      await Transaction.create({
        businessId: demoBusiness._id,
        userId: demoUser._id,
        type: 'purchase',
        amount: amountPaid,
        paymentMethod: seedPurchase.pm,
        date: purchaseDate,
        description: `Purchase - ${purchase.invoiceNumber} from ${seedPurchase.supplier.name}`,
        reference: purchase.invoiceNumber,
        entityType: 'purchase',
        entityId: purchase._id,
      });
    }

    console.log('Demo user created:', demoUser.email, '/', demoPassword);
    console.log('Demo business:', demoBusiness.name);
    console.log('Products:', products.length, '| Sales:', seedSales.length, '| Expenses:', seedExpenses.length, '| Customers:', customers.length, '| Suppliers:', suppliers.length, '| Purchases:', seedPurchases.length);
    console.log('Seeding complete!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
