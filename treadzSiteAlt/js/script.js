document.addEventListener('DOMContentLoaded', function() {
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.padding = '10px 0';
            navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for sticky header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    console.log("Treadz Professional Site Script Loaded");

    // Reveal on Scroll
    const reveals = document.querySelectorAll(".reveal");

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add("active");
            }
        });
        
        // Add Floating animation to intro icons randomly
        const icons = document.querySelectorAll('.intro-item i');
        icons.forEach(icon => {
             icon.classList.add('floating-icon');
        });
    };

    window.addEventListener("scroll", revealOnScroll);
    // Trigger once on load
    revealOnScroll();

    // --- 3D Magnetic Service Cards Logic ---
    const cards = document.querySelectorAll('.service-card-modern');

    cards.forEach(card => {
        // Add glare element if not present
        if (!card.querySelector('.card-glare')) {
            const glare = document.createElement('div');
            glare.className = 'card-glare';
            card.appendChild(glare);
        }

        const glare = card.querySelector('.card-glare');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // Calculate mouse position relative to center of card
            // 0,0 is center
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Rotation strength
            const multiplier = 15; // Max degrees
            
            // X position affects Y rotation (left/right tilts card around Y axis)
            const rotateY = (x / (rect.width / 2)) * multiplier;
            // Y position affects X rotation (up/down tilts card around X axis - inverted)
            const rotateX = -(y / (rect.height / 2)) * multiplier;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            
            // Glare positioning
            if (glare) {
                // Adjust glare position opposite to mouse to simulate light source reflection
                glare.style.transform = `translate(${x}px, ${y}px) translateZ(1px)`;
                glare.style.opacity = '0.3';
            }
        });

        card.addEventListener('mouseleave', () => {
            // Reset state
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            if (glare) {
                glare.style.opacity = '0';
            }
        });
    });
});
