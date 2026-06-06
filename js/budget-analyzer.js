
let budgetChartInstance = null;

function renderBudgetPage(budget) {
  budget = budget || getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' });

  const income = Number(budget.income || 0);
  const expenses = Number(budget.expenses || 0);
  const balance = Number(budget.balance || 0);
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  // Stat cards
  const statIncome = document.getElementById('statIncome');
  const statExpenses = document.getElementById('statExpenses');
  const statBalance = document.getElementById('statBalance');
  const statSavingsRate = document.getElementById('statSavingsRate');
  const savingsRateBar = document.getElementById('savingsRateBar');

  if (statIncome) statIncome.textContent = `RM ${income.toFixed(2)}`;
  if (statExpenses) statExpenses.textContent = `RM ${expenses.toFixed(2)}`;
  if (statBalance) {
    statBalance.textContent = `RM ${balance.toFixed(2)}`;
    statBalance.className = balance >= 0 ? 'text-success h3' : 'text-danger h3';
  }
  if (statSavingsRate) statSavingsRate.textContent = `${savingsRate}%`;
  if (savingsRateBar) {
    savingsRateBar.style.width = `${Math.min(100, savingsRate)}%`;
    savingsRateBar.className = `progress-bar ${savingsRate >= 20 ? 'bg-success' : savingsRate >= 10 ? 'bg-warning' : 'bg-danger'}`;
  }

  // Status badge
  const badge = document.getElementById('budgetStatusBadge');
  if (badge) {
    if (balance < 0) {
      badge.textContent = 'Overspending';
      badge.className = 'badge bg-danger fs-6 px-3 py-2';
    } else if (savingsRate >= 20) {
      badge.textContent = 'Saving Well';
      badge.className = 'badge bg-success fs-6 px-3 py-2';
    } else {
      badge.textContent = 'Can Improve';
      badge.className = 'badge bg-warning fs-6 px-3 py-2';
    }
  }

  // Tips
  const tipsEl = document.getElementById('budgetTips');
  if (tipsEl) {
    let tips = [];
    if (balance < 0) {
      tips = [
        { text: 'You are spending more than you earn. Review your expenses immediately.', color: 'danger' },
        { text: 'Identify non-essential expenses you can cut this month.', color: 'danger' },
        { text: 'Consider creating a strict monthly spending plan.', color: 'warning' },
      ];
    } else if (savingsRate < 10) {
      tips = [
        { text: 'Your savings rate is below 10%. Try to save at least 20% of your income.', color: 'warning' },
        { text: 'Look for subscriptions or recurring costs you can cancel.', color: 'warning' },
        { text: 'Set a savings goal to stay motivated.', color: 'info' },
      ];
    } else if (savingsRate < 20) {
      tips = [
        { text: `You are saving ${savingsRate}% of your income. Aim for 20% or more.`, color: 'info' },
        { text: 'Consider putting extra savings into a fixed deposit or unit trust.', color: 'info' },
        { text: 'Check your goals page — are you on track?', color: 'success' },
      ];
    } else {
      tips = [
        { text: `Excellent! You are saving ${savingsRate}% of your income.`, color: 'success' },
        { text: 'Consider investing your surplus for long-term growth.', color: 'success' },
        { text: 'Review your investment profile to maximise returns.', color: 'success' },
      ];
    }

    tipsEl.innerHTML = tips.map(t => `
      <div class="alert alert-${t.color} py-2 mb-2" style="font-size:.875rem">
        ${t.text}
      </div>
    `).join('');
  }

  // Savings vs 50% target bar
  const target = income * 0.5;
  const savingsVsTarget = target > 0 ? Math.round((balance / target) * 100) : 0;
  const savingsVsTargetEl = document.getElementById('savingsVsTarget');
  const savingsTargetBar = document.getElementById('savingsTargetBar');
  if (savingsVsTargetEl) savingsVsTargetEl.textContent = `${Math.min(100, savingsVsTarget)}%`;
  if (savingsTargetBar) {
    savingsTargetBar.style.width = `${Math.min(100, savingsVsTarget)}%`;
    savingsTargetBar.className = `progress-bar ${savingsVsTarget >= 100 ? 'bg-success' : savingsVsTarget >= 50 ? 'bg-info' : 'bg-warning'}`;
  }

  // Chart
  const canvas = document.getElementById('budgetChart');
  if (canvas) {
    if (budgetChartInstance) budgetChartInstance.destroy();
    budgetChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Expenses', 'Savings'],
        datasets: [{
          data: [expenses, balance > 0 ? balance : 0],
          backgroundColor: ['#dc3545', '#198754'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        cutout: '65%'
      }
    });
  }

  // Pre-fill form
  const incomeInput = document.getElementById('budgetIncome');
  const expensesInput = document.getElementById('budgetExpenses');
  if (incomeInput) incomeInput.value = income || '';
  if (expensesInput) expensesInput.value = expenses || '';
}

async function initBudgetAnalyzer() {
  const form = document.getElementById('budgetForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      const income = Number(document.getElementById('budgetIncome').value);
      const expenses = Number(document.getElementById('budgetExpenses').value);
      if (isNaN(income) || isNaN(expenses) || income < 0 || expenses < 0) {
        setAlert('budgetAlert', 'Please enter valid income and expense amounts.', 'danger');
        return;
      }
      try {
        const budget = await apiFetch('/budget', { method: 'PUT', body: JSON.stringify({ income, expenses }) });
        renderBudgetPage(budget);
        setAlert('budgetAlert', 'Budget updated successfully.', 'success');
      } catch (err) {
        setAlert('budgetAlert', err.message, 'danger');
      }
    });
  }
  try {
    const budget = await apiFetch('/budget');
    renderBudgetPage(budget);
  } catch (err) {
    renderBudgetPage();
  }
}

// function initBudgetAnalyzer() {
//   const form = document.getElementById('budgetForm');
//   if (form) {
//     form.addEventListener('submit', function(event) {
//       event.preventDefault();
//       const income = Number(document.getElementById('budgetIncome').value);
//       const expenses = Number(document.getElementById('budgetExpenses').value);
//       if (isNaN(income) || isNaN(expenses) || income < 0 || expenses < 0) {
//         setAlert('budgetAlert', 'Please enter valid income and expense amounts.', 'danger');
//         return;
//       }
//       const balance = income - expenses;
//       const status = balance < 0 ? 'Overspending - consider lowering expenses.' : 'Saving well - keep it up!';
//       setStorage(STORAGE_KEYS.budget, { income, expenses, balance, status });
//       renderBudgetPage();
//       setAlert('budgetAlert', 'Budget updated successfully.', 'success');
//     });
//   }
//   renderBudgetPage();
// }

document.addEventListener('DOMContentLoaded', initBudgetAnalyzer);