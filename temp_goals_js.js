let currentGoals = [];

function renderGoalsTable(goals) {
  const tbody = document.getElementById('goalTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  currentGoals = goals || [];
  if (goals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No goals added yet.</td></tr>';
    return;
  }

  goals.forEach((goal) => {
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
          <button class="btn btn-secondary btn-sm me-2" onclick="openEditModal('${goal._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteGoal('${goal._id}')">Delete</button>
        </td>
      </tr>
    `;
  });
  
}

// function renderGoalsTable() {
//   const goals = getStorage(STORAGE_KEYS.goals, []);
//   const tbody = document.getElementById('goalTableBody');
//   if (!tbody) {
//     return;
//   }
//   tbody.innerHTML = '';
//   if (goals.length === 0) {
//     tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No goals added yet.</td></tr>';
//     return;
//   }

//   goals.forEach((goal, index) => {
//     const target = Number(goal.target || 0);
//     const saved = Number(goal.saved || 0);
//     const progress = target === 0 ? 0 : Math.min(100, Math.round((saved / target) * 100));

//     let barColor;
//     if (progress === 100) {
//       barColor = 'bg-success';      // green  complete
//     } else if (progress >= 50) {
//       barColor = 'bg-info';         // blue   halfway there
//     } else if (progress >= 25) {
//       barColor = 'bg-warning';      // yellow just started
//     } else {
//       barColor = 'bg-danger';       // red    barely started
//     }

//     tbody.innerHTML += `
//       <tr>
//         <td>${goal.name}</td>
//         <td>RM ${target.toFixed(2)}</td>
//         <td>RM ${saved.toFixed(2)}</td>
//         <td>
//           <div class="progress">
//             <div class="progress-bar ${barColor}" role="progressbar" style="width: ${progress}%">${progress}%</div>
//           </div>
//         </td>
//         <td>
//           <button class="btn btn-danger btn-sm" onclick="deleteGoal(${index})">Delete
//           </button>
//         </td>
//       </tr>
//     `;
//   });
  
// }

async function initGoals() {
  const form = document.getElementById('goalForm');
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const name = document.getElementById('goalName').value.trim();
      const target = Number(document.getElementById('goalTarget').value);
      const saved = Number(document.getElementById('goalSaved').value);
      if (!name || isNaN(target) || target <= 0 || isNaN(saved) || saved < 0) {
        setAlert('goalAlert', 'Please enter a valid name, target amount, and saved amount.', 'danger');
        return;
      }
      try {
        await apiFetch('/goals', { method: 'POST', body: JSON.stringify({ name, target, saved }) });
        setAlert('goalAlert', 'Goal added successfully.', 'success');
        form.reset();
        const goals = await apiFetch('/goals');
        renderGoalsTable(goals);
      } catch (err) {
        setAlert('goalAlert', err.message, 'danger');
      }
    });
  }
  const goals = await apiFetch('/goals');
  renderGoalsTable(goals);
}

// function initGoals() {
//   const form = document.getElementById('goalForm');
//   if (form) {
//     form.addEventListener('submit', function (event) {
//       event.preventDefault();
//       const name = document.getElementById('goalName').value.trim();
//       const target = Number(document.getElementById('goalTarget').value);
//       const saved = Number(document.getElementById('goalSaved').value);
//       if (!name || isNaN(target) || target <= 0 || isNaN(saved) || saved < 0) {
//         setAlert('goalAlert', 'Please enter a valid name, target amount, and saved amount.', 'danger');
//         return;
//       }
//       const goals = getStorage(STORAGE_KEYS.goals, []);
//       goals.push({ name, target, saved });
//       setStorage(STORAGE_KEYS.goals, goals);
//       setAlert('goalAlert', 'Goal added successfully.', 'success');
//       renderGoalsTable();
//       updateDashboardTotals();
//       form.reset();
//     });
//   }
//   renderGoalsTable();
// }

async function deleteGoal(id) {
  try {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
    setAlert('goalAlert', 'Goal deleted successfully.', 'success');
    const goals = await apiFetch('/goals');
    renderGoalsTable(goals);
  } catch (err) {
    setAlert('goalAlert', err.message, 'danger');
  }
}

function openEditModal(id) {
  const goal = currentGoals.find(g => g._id === id);
  if (!goal) return;
  document.getElementById('editGoalId').value = goal._id;
  document.getElementById('editGoalName').value = goal.name || '';
  document.getElementById('editGoalTarget').value = Number(goal.target || 0);
  document.getElementById('editGoalSaved').value = Number(goal.saved || 0);
  const modalEl = document.getElementById('editGoalModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function updateGoal() {
  const id = document.getElementById('editGoalId').value;
  const name = document.getElementById('editGoalName').value.trim();
  const target = Number(document.getElementById('editGoalTarget').value);
  const saved = Number(document.getElementById('editGoalSaved').value);
  if (!name || isNaN(target) || target <= 0 || isNaN(saved) || saved < 0) {
    setAlert('editGoalAlert', 'Please enter a valid name, target and saved amount.', 'danger');
    return;
  }
  try {
    await apiFetch(`/goals/${id}`, { method: 'PUT', body: JSON.stringify({ name, target, saved }) });
    setAlert('goalAlert', 'Goal updated successfully.', 'success');
    const modalEl = document.getElementById('editGoalModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    const goals = await apiFetch('/goals');
    renderGoalsTable(goals);
  } catch (err) {
    setAlert('editGoalAlert', err.message, 'danger');
  }
}

// Wire save button
document.addEventListener('DOMContentLoaded', function () {
  const saveBtn = document.getElementById('saveEditGoalBtn');
  if (saveBtn) saveBtn.addEventListener('click', updateGoal);
});

document.addEventListener('DOMContentLoaded', initGoals);

// function deleteGoal(index) {
//   const goals = getStorage(STORAGE_KEYS.goals, []);
//   if (index >= 0 && index < goals.length) {
//     goals.splice(index, 1);
//     setStorage(STORAGE_KEYS.goals, goals);
//     renderGoalsTable();
//     updateDashboardTotals();
//     setAlert('goalAlert', 'Goal deleted successfully.', 'success');
//   } else {
//     setAlert('goalAlert', 'Invalid goal index.', 'danger');
//   }
// }

// document.addEventListener('DOMContentLoaded', initGoals);