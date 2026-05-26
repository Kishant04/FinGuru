// Listen for page DOM content fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get all Read More buttons in cards
  const buttons = document.querySelectorAll(".card .btn");
  
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const card = btn.closest(".card");
      const badge = card.querySelector(".badge").textContent.trim().toLowerCase();
      
      // Identify category by badge text
      let cat = "stock";
      if (badge.includes("crypto")) cat = "crypto";
      else if (badge.includes("economy")) cat = "economy";
      
      // Redirect to news page with category parameter
      window.location.href = `news-page.html?cat=${cat}`;
    });
  });
});