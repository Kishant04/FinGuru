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
  window.location.href = 'index.html';
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
    case 'roi-calculator.html':
      initRoiCalculator();
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


document.addEventListener('DOMContentLoaded', initPage);

