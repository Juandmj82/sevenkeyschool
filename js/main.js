// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const nav = document.querySelector('nav');
    
    // Create mobile menu
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu bg-white w-full py-4 px-6 shadow-lg hidden';
    mobileMenu.innerHTML = `
        <a href="#inicio" class="block py-2 hover:text-indigo-600 transition">Inicio</a>
        <a href="#sobre-mi" class="block py-2 hover:text-indigo-600 transition">Sobre Mí</a>
        <a href="#educacion" class="block py-2 hover:text-indigo-600 transition">Metodología Educativa</a>
        <a href="#servicios" class="block py-2 hover:text-indigo-600 transition">Servicios</a>
        <a href="#contacto" class="block py-2 hover:text-indigo-600 transition">Contacto</a>
    `;
    nav.appendChild(mobileMenu);

    // Navigation Scroll Effect
    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);

    // Toggle mobile menu
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        if (!mobileMenu.classList.contains('hidden')) {
            nav.classList.add('nav-scrolled');
        } else if (window.scrollY <= 50) {
            nav.classList.remove('nav-scrolled');
        }
    });

    // Close mobile menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            if (window.scrollY <= 50) {
                nav.classList.remove('nav-scrolled');
            }
        });
    });
});

// Scroll Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('section:not(#inicio)').forEach(section => {
        observer.observe(section);
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Skill bars animation
const animateSkillBars = () => {
    const skillBars = document.querySelectorAll('.bg-indigo-600');
    skillBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.width = width;
        }, 200);
    });
};

// Trigger skill bars animation when the technology section is in view
const techSection = document.querySelector('#tecnologia');
const techObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateSkillBars();
            techObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    if (techSection) {
        techObserver.observe(techSection);
    }
});

// Testimonials slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    let currentSlide = 0;

    if (!slider || !slides.length || !prevButton || !nextButton) {
        console.error('Some slider elements were not found');
        return;
    }

    function updateSlidePosition() {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlidePosition();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlidePosition();
    }

    // Event listeners
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);

    // Initialize the first slide
    updateSlidePosition();
});
