const mongoose = require('mongoose');

// BUDGET collection - exactly one budget document per user (one-to-one).
const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // enforces one-to-one: a user cannot have two budgets
    },
    income: {
      type: Number,
      default: 0,
      min: [0, 'Income cannot be negative'],
    },
    expenses: {
      type: Number,
      default: 0,
      min: [0, 'Expenses cannot be negative'],
    },
    // Per-category breakdown of expenses. Stored so the chart/categories
    // persist across devices instead of being lost on save.
    expensesBreakdown: {
      food: { type: Number, default: 0, min: [0, 'Amount cannot be negative'] },
      transport: { type: Number, default: 0, min: [0, 'Amount cannot be negative'] },
      entertainment: { type: Number, default: 0, min: [0, 'Amount cannot be negative'] },
      bills: { type: Number, default: 0, min: [0, 'Amount cannot be negative'] },
      others: { type: Number, default: 0, min: [0, 'Amount cannot be negative'] },
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: 'No budget data yet.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);