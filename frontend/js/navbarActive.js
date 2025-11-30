// navbarActive.js
// Highlights the current page in the navbar

document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.app-links .nav-btn');
  const current = window.location.pathname.split('/').pop();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === current) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
