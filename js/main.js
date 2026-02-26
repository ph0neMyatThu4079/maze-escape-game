const menu = document.getElementById('nav-menu');
const hamburger = document.getElementById('hamburger');

function toggleMenu() {
    menu.classList.toggle('open');
    hamburger.classList.toggle('active');
}

// 1. Close when "a" nav link is clicked
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        hamburger.classList.remove('active');
    })
})

// 2. Close when clicking outside
window.addEventListener('click', (e) => {

    if(menu.classList.contains('open')) {

        // Check if click is outside menu and hamburger
        if(!menu.contains(e.target) && !hamburger.contains(e.target)) {
            menu.classList.remove('open');
            hamburger.classList.remove('active');
        }

    }

})