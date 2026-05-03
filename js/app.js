const STORAGE_KEYS = {
  user: 'user',
  isLoggedIn: 'isLoggedIn',
  riskLevel: 'riskLevel',
  goals: 'goals',
  budget: 'budget'
};

function getStorage(key, defaultValue = null) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null || storedValue === undefined) {
    return defaultValue;
  }
  try {
    return JSON.parse(storedValue);
  } catch (error) {
    return storedValue;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initDefaultState() {
  if (getStorage(STORAGE_KEYS.user, undefined) === undefined) {
    setStorage(STORAGE_KEYS.user, null);
  }
  if (getStorage(STORAGE_KEYS.isLoggedIn, undefined) === undefined) {
    setStorage(STORAGE_KEYS.isLoggedIn, false);
  }
  if (getStorage(STORAGE_KEYS.riskLevel, undefined) === undefined) {
    setStorage(STORAGE_KEYS.riskLevel, 'Moderate');
  }
  if (getStorage(STORAGE_KEYS.goals, undefined) === undefined) {
    setStorage(STORAGE_KEYS.goals, []);
  }
  if (getStorage(STORAGE_KEYS.budget, undefined) === undefined) {
    setStorage(STORAGE_KEYS.budget, {
      income: 0,
      expenses: 0,
      balance: 0,
      status: 'No budget data yet.'
    });
  }
}

function getPageName() {
  const parts = window.location.pathname.replace('\\', '/').split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function requireLogin() {
  const page = getPageName();
  const publicPages = ['login.html', 'register.html', 'index.html'];
  if (publicPages.includes(page)) {
    return;
  }
  const loggedIn = getStorage(STORAGE_KEYS.isLoggedIn, false);
  if (!loggedIn) {
    const prefix = page ? '../' : '';
    window.location.href = `${prefix}login.html`;
  }
}

function setAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function getPasswordStrengthLabel(password) {
  const score = getPasswordStrength(password);
  if (score <= 2) {
    return { label: 'Weak', color: 'danger' };
  }
  if (score === 3) {
    return { label: 'Fair', color: 'warning' };
  }
  if (score === 4) {
    return { label: 'Good', color: 'info' };
  }
  return { label: 'Strong', color: 'success' };
}

function redirectToDashboard() {
  window.location.href = 'pages/dashboard.html';
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) {
    return;
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
      setAlert('loginAlert', 'Please enter both email and password.');
      return;
    }
    if (!validateEmail(email)) {
      setAlert('loginAlert', 'Please enter a valid email address.');
      return;
    }
    const user = getStorage(STORAGE_KEYS.user, null);
    if (!user || user.email !== email || user.password !== password) {
      setAlert('loginAlert', 'Invalid email or password. Please try again.');
      return;
    }
    setStorage(STORAGE_KEYS.isLoggedIn, true);
    redirectToDashboard();
  });
}

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) {
    return;
  }
  const passwordInput = document.getElementById('registerPassword');
  const strengthText = document.getElementById('passwordStrength');
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = getPasswordStrengthLabel(password);
    strengthText.textContent = password ? `Strength: ${strength.label}` : '';
    strengthText.className = `form-text text-${strength.color}`;
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerPasswordConfirm').value;
    if (!name || !email || !password || !confirm) {
      setAlert('registerAlert', 'Please complete all fields before registering.');
      return;
    }
    if (!validateEmail(email)) {
      setAlert('registerAlert', 'Please enter a valid email address.');
      return;
    }
    if (password !== confirm) {
      setAlert('registerAlert', 'Passwords do not match.');
      return;
    }
    if (getPasswordStrength(password) < 3) {
      setAlert('registerAlert', 'Choose a stronger password with at least 8 characters, including letters and numbers.');
      return;
    }
    const existingUser = getStorage(STORAGE_KEYS.user, null);
    if (existingUser && existingUser.email === email) {
      setAlert('registerAlert', 'A user with that email already exists. Please login or use another email.');
      return;
    }
    const user = { name, email, password };
    setStorage(STORAGE_KEYS.user, user);
    setStorage(STORAGE_KEYS.isLoggedIn, false);
    setAlert('registerAlert', 'Account created successfully. Redirecting to login...', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  });
}

function updateBudgetSummary() {
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' });
  const totalSavings = getStorage(STORAGE_KEYS.goals, []).reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  document.getElementById('balance').textContent = budget.balance.toFixed(2);
  document.getElementById('budgetResult').textContent = budget.balance.toFixed(2);
  document.getElementById('budgetStatus').textContent = budget.status;
  document.getElementById('profileBalance').textContent = budget.balance.toFixed(2);
  document.getElementById('profileSavings').textContent = totalSavings.toFixed(2);
}

function updateDashboardTotals() {
  const goals = getStorage(STORAGE_KEYS.goals, []);
  const totalGoals = goals.length;
  const totalSavings = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' });
  document.getElementById('totalGoals').textContent = totalGoals;
  document.getElementById('totalSavings').textContent = `RM ${totalSavings.toFixed(2)}`;
  document.getElementById('balance').textContent = `RM ${budget.balance.toFixed(2)}`;
}

function updateRiskDisplay() {
  const riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');
  document.getElementById('riskLevelBadge').textContent = `Risk Level: ${riskLevel}`;
  document.getElementById('recommendationRisk').textContent = riskLevel;
  document.getElementById('riskResult').textContent = `Saved risk profile: ${riskLevel}`;
  document.getElementById('profileRisk').textContent = riskLevel;
}

function calculateRiskLevel(score) {
  if (score <= 7) {
    return 'Conservative';
  }
  if (score <= 11) {
    return 'Moderate';
  }
  return 'Aggressive';
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
      setAlert('budgetStatus', `Budget analyzed successfully. ${status}`, 'success');
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
      setAlert('riskResult', `Your risk profile is ${result}.`, 'success');
    });
  }
  updateBudgetSummary();
  updateDashboardTotals();
  updateRiskDisplay();
}

function renderGoalsTable() {
  const goals = getStorage(STORAGE_KEYS.goals, []);
  const tbody = document.getElementById('goalTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  if (goals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No goals added yet.</td></tr>';
    return;
  }

  goals.forEach((goal, index) => {
    const target = Number(goal.target || 0);
    const saved = Number(goal.saved || 0);
    const progress = target === 0 ? 0 : Math.min(100, Math.round((saved / target) * 100));

    let barColor;
    if (progress === 100) {
      barColor = 'bg-success';      // green  — complete
    } else if (progress >= 50) {
      barColor = 'bg-info';         // blue   — halfway there
    } else if (progress >= 25) {
      barColor = 'bg-warning';      // yellow — just started
    } else {
      barColor = 'bg-danger';       // red    — barely started
    }

    tbody.innerHTML += `
      <tr>
        <td>${goal.name}</td>
        <td>RM ${target.toFixed(2)}</td>
        <td>RM ${saved.toFixed(2)}</td>
        <td>
          <div class="progress">
            <div class="progress-bar ${barColor}" role="progressbar" style="width: ${progress}%">${progress}%</div>
          </div>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteGoal(${index})">Delete
          </button>
        </td>
      </tr>
    `;
  });
  
}

function initGoals() {
  const form = document.getElementById('goalForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const name = document.getElementById('goalName').value.trim();
      const target = Number(document.getElementById('goalTarget').value);
      const saved = Number(document.getElementById('goalSaved').value);
      if (!name || isNaN(target) || target <= 0 || isNaN(saved) || saved < 0) {
        setAlert('goalAlert', 'Please enter a valid name, target amount, and saved amount.', 'danger');
        return;
      }
      const goals = getStorage(STORAGE_KEYS.goals, []);
      goals.push({ name, target, saved });
      setStorage(STORAGE_KEYS.goals, goals);
      setAlert('goalAlert', 'Goal added successfully.', 'success');
      renderGoalsTable();
      updateDashboardTotals();
      form.reset();
    });
  }
  renderGoalsTable();
}

function deleteGoal(index) {
  const goals = getStorage(STORAGE_KEYS.goals, []);
  if (index >= 0 && index < goals.length) {
    goals.splice(index, 1);
    setStorage(STORAGE_KEYS.goals, goals);
    renderGoalsTable();
    updateDashboardTotals();
    setAlert('goalAlert', 'Goal deleted successfully.', 'success');
  } else {
    setAlert('goalAlert', 'Invalid goal index.', 'danger');
  }
}

function initRoiCalculator() {
  const roiForm = document.getElementById('roiForm');
  if (roiForm) {
    roiForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const initial = Number(document.getElementById('initialAmount').value);
      const finalValue = Number(document.getElementById('finalAmount').value);
      if (isNaN(initial) || isNaN(finalValue) || initial <= 0 || finalValue < 0) {
        setAlert('roiResult', 'Please enter valid investment values.', 'danger');
        return;
      }
      const profit = finalValue - initial;
      const roi = (profit / initial) * 100;
      document.getElementById('roiResult').textContent = `${roi.toFixed(2)}%`;
      document.getElementById('profitResult').textContent = `RM ${profit.toFixed(2)}`;
    });
  }
  const compoundForm = document.getElementById('compoundForm');
  if (compoundForm) {
    compoundForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const principal = Number(document.getElementById('compoundPrincipal').value);
      const rate = Number(document.getElementById('compoundRate').value) / 100;
      const times = Number(document.getElementById('compoundFrequency').value);
      const years = Number(document.getElementById('compoundYears').value);
      if (isNaN(principal) || principal <= 0 || isNaN(rate) || rate < 0 || isNaN(times) || times <= 0 || isNaN(years) || years <= 0) {
        setAlert('compoundResult', 'Please enter valid compound interest values.', 'danger');
        return;
      }
      const amount = principal * Math.pow(1 + rate / times, times * years);
      const earned = amount - principal;
      document.getElementById('compoundResult').textContent = `RM ${amount.toFixed(2)}`;
      document.getElementById('compoundInterestResult').textContent = `RM ${earned.toFixed(2)}`;
    });
  }
}

function getRiskRecommendations(riskLevel) {
  const options = {
    Conservative: {
      description: 'A conservative investor values stability and lower risk. Focus on bonds, fixed income, and cash-equivalents.',
      assets: ['High-quality bonds', 'Money market funds', 'Defensive blue-chip stocks']
    },
    Moderate: {
      description: 'A moderate investor balances growth and safety. Diversify across equities and bonds.',
      assets: ['Balanced mutual funds', 'Index funds', 'Dividend-paying stocks']
    },
    Aggressive: {
      description: 'An aggressive investor is comfortable with market ups and downs for higher growth potential.',
      assets: ['Growth stocks', 'Emerging market funds', 'Small-cap equities']
    }
  };
  return options[riskLevel] || options.Moderate;
}

function initInvestmentRecommendation() {
  const title = document.getElementById('recommendationText');
  const list = document.getElementById('recommendationAssets');
  const riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');
  const recommendation = getRiskRecommendations(riskLevel);
  if (title) {
    title.innerHTML = `<p>${recommendation.description}</p>`;
  }
  if (list) {
    list.innerHTML = recommendation.assets.map(asset => `<p class="mb-2"><strong>•</strong> ${asset}</p>`).join('');
  }
}

function initProfile() {
  const user = getStorage(STORAGE_KEYS.user, null);
  const goals = getStorage(STORAGE_KEYS.goals, []);
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' });
  if (user) {
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
  }
  document.getElementById('profileGoalsCount').textContent = goals.length;
  document.getElementById('profileSavings').textContent = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0).toFixed(2);
  document.getElementById('profileBudgetStatus').textContent = budget.status;
  updateRiskDisplay();
}

function initEditProfile() {
  const user = getStorage(STORAGE_KEYS.user, null);
  const nameInput = document.getElementById('editName');
  const emailInput = document.getElementById('editEmail');
  if (user && nameInput && emailInput) {
    nameInput.value = user.name;
    emailInput.value = user.email;
  }
  const form = document.getElementById('editProfileForm');
  if (!form) {
    return;
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email || !validateEmail(email)) {
      setAlert('editProfileAlert', 'Please enter a valid name and email address.', 'danger');
      return;
    }
    const updatedUser = { ...user, name, email };
    setStorage(STORAGE_KEYS.user, updatedUser);
    setAlert('editProfileAlert', 'Profile updated successfully.', 'success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
  });
}

function initChangePassword() {
  const form = document.getElementById('changePasswordForm');
  if (!form) {
    return;
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const user = getStorage(STORAGE_KEYS.user, null);
    if (!user) {
      setAlert('changePasswordAlert', 'No account found. Please login again.', 'danger');
      return;
    }
    if (currentPassword !== user.password) {
      setAlert('changePasswordAlert', 'Current password is incorrect.', 'danger');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAlert('changePasswordAlert', 'New passwords do not match.', 'danger');
      return;
    }
    if (getPasswordStrength(newPassword) < 3) {
      setAlert('changePasswordAlert', 'Please choose a stronger password.', 'danger');
      return;
    }
    user.password = newPassword;
    setStorage(STORAGE_KEYS.user, user);
    setAlert('changePasswordAlert', 'Password updated successfully.', 'success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
  });
}

function attachLogoutHandler() {
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (event) {
      event.preventDefault();
      setStorage(STORAGE_KEYS.isLoggedIn, false);
      window.location.href = '../login.html';
    });
  }
}

function initPage() {
  initDefaultState();
  requireLogin();
  attachLogoutHandler();
  const page = getPageName();
  switch (page) {
    case 'login.html':
      initLogin();
      break;
    case 'register.html':
      initRegister();
      break;
    case 'dashboard.html':
      initDashboard();
      break;
    case 'goals.html':
      initGoals();
      break;
    case 'roi-calculator.html':
      initRoiCalculator();
      break;
    case 'investment-recommendation.html':
      initInvestmentRecommendation();
      break;
    case 'profile.html':
      initProfile();
      break;
    case 'edit-profile.html':
      initEditProfile();
      break;
    case 'change-password.html':
      initChangePassword();
      break;
    default:
      break;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key));
}

// =====================================
// REGISTER
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  const passwordInput = document.getElementById("registerPassword");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthText = document.getElementById("passwordStrengthText");

  passwordInput.addEventListener("input", function () {

    const password = passwordInput.value;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;

    const percentage = strength * 25;

    strengthBar.style.width = percentage + "%";

    if (strength <= 1) {
      strengthBar.className = "progress-bar bg-danger";
      strengthText.textContent = "Weak Password";
    }
    else if (strength <= 3) {
      strengthBar.className = "progress-bar bg-warning";
      strengthText.textContent = "Medium Password";
    }
     else {
      strengthBar.className = "progress-bar bg-success";
      strengthText.textContent = "Strong Password";
    }
  });

  registerForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const user = {
      name,
      email,
      password
      };

    saveData("user", user);

    alert("Registration successful!");

    window.location.href = "login.html";
  });
}

// =====================================
// LOGIN
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", function (e) {

    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const savedUser = getData("user");

    if (!savedUser) {
      alert("No account found!");
      return;
    }

    if (
      email === savedUser.email &&
      password === savedUser.password
    ) {
      localStorage.setItem("isLoggedIn", "true");

      alert("Login successful!");

      window.location.href = "dashboard.html";
    }
    else {
      alert("Invalid email or password!");
    }
  });
}

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const saveProfileBtn = document.getElementById("saveProfileBtn");

if (profileName && profileEmail) {

  const user = getData("user");

  if (user) {
    profileName.value = user.name;
    profileEmail.value = user.email;
  }
}

if (saveProfileBtn) {

  saveProfileBtn.addEventListener("click", function () {

    const updatedUser = {
      ...getData("user"),
      name: profileName.value,
      email: profileEmail.value
    };
    saveData("user", updatedUser);

    alert("Profile updated successfully!");
  });
}

// =====================================
// ROI CALCULATOR
// =====================================

const roiForm = document.getElementById("roiForm");

if (roiForm) {

  roiForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const initialInvestment = parseFloat(document.getElementById("initialInvestment").value);

    const finalValue = parseFloat(document.getElementById("finalValue").value);

    const roi = ((finalValue - initialInvestment) / initialInvestment) * 100;
    document.getElementById("roiResult").textContent = `ROI: ${roi.toFixed(2)}%`;
  });
}

// =====================================
//  CHARTS
// =====================================

function initCharts() {
  const budget = getStorage(STORAGE_KEYS.budget, { income: 0, expenses: 0, balance: 0 });
  const goals = getStorage(STORAGE_KEYS.goals, []);

  // ── Budget Doughnut Chart ──
  const budgetCanvas = document.getElementById('budgetChart');
  if (budgetCanvas) {
    new Chart(budgetCanvas, {
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
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // ── Goals Bar Chart ──
  const goalsCanvas = document.getElementById('goalsChart');
  if (goalsCanvas) {
    new Chart(goalsCanvas, {
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
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
    

document.addEventListener('DOMContentLoaded', initPage);

document.addEventListener('DOMContentLoaded', function() {
  const page = getPageName();
  if (page === 'dashboard.html') initCharts();
});
