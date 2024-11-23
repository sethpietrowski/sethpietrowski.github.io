document.addEventListener("DOMContentLoaded", () => {
    fetch('banner.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('banner-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading banner: ', error));
});