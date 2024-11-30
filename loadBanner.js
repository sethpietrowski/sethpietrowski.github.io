document.addEventListener("DOMContentLoaded", async () => {
    const bannerPlaceholder = document.getElementById('banner-placeholder');
    try {
        const response = await fetch('banner.html');
        if (!response.ok) throw new Error(`HTTP error. Status: ${response.status}`);
        bannerPlaceholder.innerHTML = await response.text();

    } catch (error) {
        console.error('Error loading banner:', error);
    }
});