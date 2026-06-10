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

function calculateRiskLevel(score) {
  if (score <= 7) return 'Conservative';
  if (score <= 11) return 'Moderate';
  return 'Aggressive';
}

function initQuiz() {
  const form = document.getElementById('riskQuizForm');
  if (!form) return;

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const answers = [
      Number(document.getElementById('riskQuestion1').value),
      Number(document.getElementById('riskQuestion2').value),
      Number(document.getElementById('riskQuestion3').value),
      Number(document.getElementById('riskQuestion4').value),
      Number(document.getElementById('riskQuestion5').value)
    ];
    if (answers.some(v => !v)) {
      setAlert('quizAlert', 'Please answer all 5 questions.', 'danger');
      return;
    }
    const score = answers.reduce((sum, v) => sum + v, 0);
    const result = calculateRiskLevel(score);
    try {
      const profile = await apiFetch('/risk', { method: 'PUT', body: JSON.stringify({ answers }) });
      setStorage(STORAGE_KEYS.riskLevel, profile.level);
      await initInvestmentRecommendation();
      setAlert('quizAlert', `Your investor profile is ${profile.level}.`, 'success');
    } catch (err) {
      setStorage(STORAGE_KEYS.riskLevel, result);
      await initInvestmentRecommendation();
      setAlert('quizAlert', `Your investor profile is ${result}.`, 'success');
    }
  });
}

async function initInvestmentRecommendation() {
  let riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');

  try {
    const profile = await apiFetch('/risk');
    riskLevel = profile.level || riskLevel;
  } catch (err) {
    console.warn('Could not load risk profile:', err.message);
  }

  const container = document.getElementById('recommendationContainer');
  const badge = document.getElementById('riskBadge');

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

  if (!container) return;

  const recommendation = getRiskRecommendations(riskLevel);

  container.innerHTML = recommendation.assets.map(asset => `
    <div class="col-lg-4">
      <div class="card recommendation-card h-100 shadow-sm p-4 d-flex flex-column">
        <h4 class="mb-3">${asset}</h4>
        <p class="text-muted">${recommendation.description}</p>
      </div>
    </div>
  `).join('');

  initQuiz(); 
}

// function initInvestmentRecommendation() {
//   const riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');
//   const container = document.getElementById('recommendationContainer');
//   const badge = document.getElementById('riskBadge');

//   if (badge) {
//     badge.textContent = riskLevel;
//     if (riskLevel === 'Conservative') {
//       badge.className = 'badge bg-success fs-6 px-4 py-2';
//     } else if (riskLevel === 'Moderate') {
//       badge.className = 'badge bg-primary fs-6 px-4 py-2';
//     } else {
//       badge.className = 'badge bg-danger fs-6 px-4 py-2';
//     }
//   }

//   if (!container) return;

//   const recommendation = getRiskRecommendations(riskLevel);

//   container.innerHTML = recommendation.assets.map(asset => `
//     <div class="col-lg-4">
//       <div class="card recommendation-card h-100 shadow-sm p-4 d-flex flex-column">
//         <h4 class="mb-3">${asset}</h4>
//         <p class="text-muted">${recommendation.description}</p>
//       </div>
//     </div>
//   `).join('');
// }

document.addEventListener('DOMContentLoaded', initInvestmentRecommendation);