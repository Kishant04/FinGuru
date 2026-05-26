let budgetChartInstance = null;
let goalsChartInstance = null;

function updateBudgetSummary() {
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' });
  const totalSavings = getStorage(STORAGE_KEYS.goals, []).reduce((sum, goal) => sum + Number(goal.saved || 0), 0);

  const balance = document.getElementById('balance');
  const budgetResult = document.getElementById('budgetResult');
  const budgetStatus = document.getElementById('budgetStatus');
  const profileBalance = document.getElementById('profileBalance');
  const profileSavings = document.getElementById('profileSavings');

  if (balance) balance.textContent = budget.balance.toFixed(2);
  if (budgetResult) budgetResult.textContent = budget.balance.toFixed(2);
  if (budgetStatus) budgetStatus.textContent = budget.status;
  if (profileBalance) profileBalance.textContent = budget.balance.toFixed(2);
  if (profileSavings) profileSavings.textContent = totalSavings.toFixed(2);
}

function updateDashboardTotals() {
  const goals = getStorage(STORAGE_KEYS.goals, []);
  const totalSavings = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0 });

  const totalGoals = document.getElementById('totalGoals');
  const totalSavingsEl = document.getElementById('totalSavings');
  const balance = document.getElementById('balance');

  if (totalGoals) totalGoals.textContent = goals.length;
  if (totalSavingsEl) totalSavingsEl.textContent = `RM ${totalSavings.toFixed(2)}`;
  if (balance) balance.textContent = `RM ${budget.balance.toFixed(2)}`;
}

function updateRiskDisplay() {
  const riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');
  const badge = document.getElementById('riskBadge');
  const riskResult = document.getElementById('riskResult');

  if (badge) {
    badge.textContent = riskLevel;
    if (riskLevel === 'Conservative') {
      badge.className = 'badge bg-success fs-6 px-4 py-2';
    } else if (riskLevel === 'Moderate') {
      badge.className = 'badge bg-primary fs-6 px-4 py-2';
    } else {
      badge.className = 'badge bg-danger fs-6 px-4 py-2';
    }
  }

  if (riskResult) riskResult.textContent = `Your investor profile is ${riskLevel}.`;
}

function calculateRiskLevel(score) {
  if (score <= 7) return 'Conservative';
  if (score <= 11) return 'Moderate';
  return 'Aggressive';
}

function initCharts() {
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0 });
  const goals = getStorage(STORAGE_KEYS.goals, []);

  const budgetCanvas = document.getElementById('budgetChart');
  if (budgetCanvas) {
    if (budgetChartInstance) budgetChartInstance.destroy();
    budgetChartInstance = new Chart(budgetCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Expenses', 'Savings'],
        datasets: [{
          data: [budget.expenses, budget.balance],
          backgroundColor: ['#dc3545', '#198754'],
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  const goalsCanvas = document.getElementById('goalsChart');
  if (goalsCanvas) {
    if (goalsChartInstance) goalsChartInstance.destroy();
    goalsChartInstance = new Chart(goalsCanvas, {
      type: 'bar',
      data: {
        labels: goals.map(g => g.name),
        datasets: [
          {
            label: 'Saved (RM)',
            data: goals.map(g => Number(g.saved)),
            backgroundColor: '#0d6efd',
          },
          {
            label: 'Target (RM)',
            data: goals.map(g => Number(g.target)),
            backgroundColor: '#dee2e6',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function initDashboard() {
  const budgetForm = document.getElementById('budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const income = Number(document.getElementById('budgetIncome').value);
      const expenses = Number(document.getElementById('budgetExpenses').value);
      if (isNaN(income) || isNaN(expenses) || income < 0 || expenses < 0) {
        setAlert('budgetStatus', 'Please provide valid income and expense amounts.', 'danger');
        return;
      }
      const balance = income - expenses;
      const status = balance < 0 ? 'Overspending - consider lowering expenses.' : 'Saving well - keep it up!';
      const budget = { income, expenses, balance, status };
      setStorage(STORAGE_KEYS.budget, budget);
      updateBudgetSummary();
      updateDashboardTotals();
      initCharts();
      setAlert('budgetStatus', `Budget analyzed. ${status}`, 'success');
    });
  }

  const riskForm = document.getElementById('riskQuizForm');
  if (riskForm) {
    riskForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const answers = [
        Number(document.getElementById('riskQuestion1').value),
        Number(document.getElementById('riskQuestion2').value),
        Number(document.getElementById('riskQuestion3').value),
        Number(document.getElementById('riskQuestion4').value),
        Number(document.getElementById('riskQuestion5').value)
      ];
      if (answers.some((value) => !value)) {
        setAlert('riskResult', 'Please answer all quiz questions.', 'danger');
        return;
      }
      const score = answers.reduce((sum, value) => sum + value, 0);
      const result = calculateRiskLevel(score);
      setStorage(STORAGE_KEYS.riskLevel, result);
      updateRiskDisplay();
      setAlert('riskResult', `Your investor profile is ${result}.`, 'success');
    });
  }

  // Welcome user
  const user = getStorage(STORAGE_KEYS.user, null);
  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName && user) welcomeName.textContent = user.name;

  updateBudgetSummary();
  updateDashboardTotals();
  updateRiskDisplay();
  initCharts();
}

document.addEventListener('DOMContentLoaded', initDashboard);