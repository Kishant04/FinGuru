function initRoiCalculator() {
  // roi fixed
  const roiForm = document.getElementById('roiForm');
  if (roiForm) {
    roiForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const initial = Number(document.getElementById('initialInvestment').value);
      const finalValue = Number(document.getElementById('finalValue').value);
      if (isNaN(initial) || isNaN(finalValue) || initial <= 0 || finalValue < 0) {
        setAlert('roiResult', 'Please enter valid investment values.', 'danger');
        return;
      }
      const profit = finalValue - initial;
      const roi = (profit / initial) * 100;
      document.getElementById('roiResult').textContent = `${roi.toFixed(2)}%`;
      document.getElementById('profitResult').textContent = `RM ${profit.toFixed(2)}`;
      try {
        await apiFetch('/roi', { method: 'POST', body: JSON.stringify({ type: 'roi', inputs: { initial, finalValue }, results: { roi, profit } }) });
      } catch (err) { console.warn('Could not save ROI history:', err.message); }
    });

    // roiForm.addEventListener('submit', function (event) {
    //   event.preventDefault();
    //   const initial = Number(document.getElementById('initialInvestment').value);
    //   const finalValue = Number(document.getElementById('finalValue').value);
    //   if (isNaN(initial) || isNaN(finalValue) || initial <= 0 || finalValue < 0) {
    //     setAlert('roiResult', 'Please enter valid investment values.', 'danger');
    //     return;
    //   }
    //   const profit = finalValue - initial;
    //   const roi = (profit / initial) * 100;
    //   document.getElementById('roiResult').textContent = `${roi.toFixed(2)}%`;
    //   document.getElementById('profitResult').textContent = `RM ${profit.toFixed(2)}`;
    // });
  }
  const compoundForm = document.getElementById('compoundForm');
  if (compoundForm) {
    compoundForm.addEventListener('submit', async function (event) {
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
      try {
        await apiFetch('/roi', { method: 'POST', body: JSON.stringify({ type: 'compound', inputs: { principal, rate: rate * 100, times, years }, results: { amount, earned } }) });
      } catch (err) { console.warn('Could not save compound history:', err.message); }
    });

    // compoundForm.addEventListener('submit', function (event) {
    //   event.preventDefault();
    //   const principal = Number(document.getElementById('compoundPrincipal').value);
    //   const rate = Number(document.getElementById('compoundRate').value) / 100;
    //   const times = Number(document.getElementById('compoundFrequency').value);
    //   const years = Number(document.getElementById('compoundYears').value);
    //   if (isNaN(principal) || principal <= 0 || isNaN(rate) || rate < 0 || isNaN(times) || times <= 0 || isNaN(years) || years <= 0) {
    //     setAlert('compoundResult', 'Please enter valid compound interest values.', 'danger');
    //     return;
    //   }
    //   const amount = principal * Math.pow(1 + rate / times, times * years);
    //   const earned = amount - principal;
    //   document.getElementById('compoundResult').textContent = `RM ${amount.toFixed(2)}`;
    //   document.getElementById('compoundInterestResult').textContent = `RM ${earned.toFixed(2)}`;
    // });
  }
  const compareBtn = document.getElementById('compareBtn');
if (compareBtn) {
  compareBtn.addEventListener('click', () => {

    const aInitial = Number(document.getElementById('optionAInitial').value);
    const aFinal = Number(document.getElementById('optionAFinal').value);
    const bInitial = Number(document.getElementById('optionBInitial').value);
    const bFinal =Number(document.getElementById('optionBFinal').value);
    if (
      aInitial <= 0 ||
      bInitial <= 0) {
      return;}
    const roiA = ((aFinal - aInitial) / aInitial) * 100;
    const roiB = ((bFinal - bInitial) / bInitial) * 100;
    const winner = roiA > roiB ? 'Option A' : 'Option B';

    document.getElementById(
      'comparisonResult'
    ).innerHTML = `
      Option A ROI: ${roiA.toFixed(2)}%<br>
      Option B ROI: ${roiB.toFixed(2)}%<br>
      Better Investment:
      <strong>${winner}</strong>
    `;
  });
}
    const projectionBtn =
  document.getElementById('projectionBtn');
if (projectionBtn) {
  projectionBtn.addEventListener('click', () => {
    const initial = Number(document.getElementById('projectionInitial').value);
    const rate = Number(document.getElementById('projectionRate').value) / 100;
    const years = Number(document.getElementById('projectionYears').value);
    const tbody = document.getElementById('projectionTable');
    tbody.innerHTML = '';
    let current = initial;
    for (let year = 1; year <= years; year++) {
      current *= (1 + rate);
      tbody.innerHTML += `
        <tr>
          <td>${year}</td>
          <td>RM ${current.toFixed(2)}</td>
        </tr>
      `;
    }
  });
}
}

document.addEventListener('DOMContentLoaded', initRoiCalculator);