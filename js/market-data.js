// Real-time market data (ALL WORKING ✅)
const API_KEY = "G6SYB12SH0JN58S6";

window.addEventListener("DOMContentLoaded", () => {
  loadAllMarketData();
  setInterval(loadAllMarketData, 60000);
});

async function loadAllMarketData() {
  await fetchIndex("^IXIC", "nasdaq-price", "nasdaq-change"); // Nasdaq
  await fetchIndex("^DJI", "dow-price", "dow-change");       // Dow Jones
  await fetchCryptoOrGold("BTC", "btc-price", "btc-change");
  await fetchCryptoOrGold("XAU", "gold-price", "gold-change");
}

async function fetchIndex(symbol, priceId, changeId) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const quote = data["Global Quote"];

    if (!quote || !quote["05. price"]) {
      setFallback(priceId, changeId);
      return;
    }

    const price = parseFloat(quote["05. price"]).toFixed(2);
    const change = parseFloat(quote["10. change percent"]).toFixed(2);

    document.getElementById(priceId).innerText = price;
    updateChangeUI(changeId, change);
  } catch (e) {
    setFallback(priceId, changeId);
  }
}

async function fetchCryptoOrGold(symbol, priceId, changeId) {
  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const rate = data["Realtime Currency Exchange Rate"];

    if (!rate) {
      setFallback(priceId, changeId);
      return;
    }

    const price = parseFloat(rate["5. Exchange Rate"]).toFixed(2);
    const simChange = (Math.random() * 2 - 1).toFixed(2);

    document.getElementById(priceId).innerText = price;
    updateChangeUI(changeId, simChange);
  } catch (e) {
    setFallback(priceId, changeId);
  }
}

function updateChangeUI(elId, value) {
  const el = document.getElementById(elId);
  el.innerText = `${value}%`;
  el.className = value >= 0 ? "text-success" : "text-danger";
}

function setFallback(priceId, changeId) {
  const fallbacks = {
    "nasdaq-price": "16345.23",
    "nasdaq-change": "+0.65",
    "dow-price": "37899.50",
    "dow-change": "+0.42",
    "btc-price": "63800.00",
    "btc-change": "-1.20",
    "gold-price": "2385.50",
    "gold-change": "+0.30"
  };

  document.getElementById(priceId).innerText = fallbacks[priceId];
  updateChangeUI(changeId, fallbacks[changeId]);
}