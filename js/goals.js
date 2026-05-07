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
      barColor = 'bg-success';      // green  complete
    } else if (progress >= 50) {
      barColor = 'bg-info';         // blue   halfway there
    } else if (progress >= 25) {
      barColor = 'bg-warning';      // yellow just started
    } else {
      barColor = 'bg-danger';       // red    barely started
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

document.addEventListener('DOMContentLoaded', initGoals);