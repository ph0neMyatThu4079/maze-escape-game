const menu = document.getElementById('nav-menu');
const hamburger = document.getElementById('hamburger');


function toggleMenu() {
    menu.classList.toggle('open');
    hamburger.classList.toggle('active');
}

function toggleTheme() {
    const html = document.documentElement; 
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = html.getAttribute('data-theme');

    if(currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');

    if(savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

// Initialize theme on page load
window.addEventListener('DOMContentLoaded', loadTheme);

// Close when "a" nav link is clicked
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        hamburger.classList.remove('active');
    })
})

// Close when clicking outside
window.addEventListener('click', (e) => {

    if(menu.classList.contains('open')) {

        // Check if click is outside menu and hamburger
        if(!menu.contains(e.target) && !hamburger.contains(e.target)) {
            menu.classList.remove('open');
            hamburger.classList.remove('active');
        }

    }

})