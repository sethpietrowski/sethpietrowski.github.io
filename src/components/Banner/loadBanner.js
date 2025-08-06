fetch('banner.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('banner-placeholder').innerHTML = html;
    })

const current = window.location.pathname.split("/").pop();
document.querySelectorAll(".navbar a").forEach(link => {
  if (link.getAttribute("href") === current) {
    link.classList.add("active");
  }
});