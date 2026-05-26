const API_KEY = "19187cacf9d94a489f027cb9d7563a9d";
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get("cat");


const config = {
  stock: { q: "global stock market", title: "Global Stock Market News" },
  crypto: { q: "crypto OR bitcoin", title: "Crypto & Bitcoin News" },
  economy: { q: "inflation OR economy", title: "Global Economy & Inflation News" }
};

let currentCat = config[category] || config.stock;
let page = 1;     // current pagea number
const pageSize = 10;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("category-title").textContent = currentCat.title;
  
  // first time load page
  loadNews(page);

  // Update button, list more news
  document.getElementById("updateBtn").addEventListener("click", () => {
    page++;
    loadNews(page);
  });
});

async function loadNews(p) {
  const container = document.getElementById("news-list");
  container.innerHTML = `
    <div class="col-12 text-center">
      <div class="spinner-border text-primary"></div>
      <p>Loading more news...</p>
    </div>
  `;

  try {
    const url = `https://newsapi.org/v2/everything?apiKey=${API_KEY}&q=${currentCat.q}&pageSize=${pageSize}&page=${p}&sortBy=publishedAt`;
    const res = await fetch(url);
    const data = await res.json();
    const articles = data.articles || [];

    if(articles.length === 0){
      container.innerHTML = `<div class="col-12 text-center text-muted">No more news available.</div>`;
      return;
    }

    container.innerHTML += articles.map(a => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${a.title}</h5>
            <p class="text-muted small">${a.description || ""}</p>
            <a href="${a.url}" target="_blank" class="btn btn-primary btn-sm">Read Full Article</a>
          </div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    container.innerHTML = `<div class="col-12 text-center text-danger">Load failed</div>`;
  }
}