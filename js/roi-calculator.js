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

document.addEventListener('DOMContentLoaded', initRoiCalculator);