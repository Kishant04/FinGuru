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
  const riskLevel = getStorage(STORAGE_KEYS.riskLevel, 'Moderate');
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
}

document.addEventListener('DOMContentLoaded', initInvestmentRecommendation);