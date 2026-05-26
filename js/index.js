if(localStorage.getItem("visited")) {
  window.location.href = "pages/dashboard.html";
} else {
  localStorage.setItem("visited", true);
}