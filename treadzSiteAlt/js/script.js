document.addEventListener('DOMContentLoaded', function () {

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
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
            const multiplier = 5; // Max degrees

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

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.addEventListener('click', (e) => {
                // Prevent bubbling if necessary, though structure is simple
                e.stopPropagation();

                const isActive = item.classList.contains('active');

                // Toggle active class
                item.classList.toggle('active');

                if (!isActive) {
                    // Opening: Set max-height to scrollHeight
                    answer.style.maxHeight = answer.scrollHeight + "px";
                } else {
                    // Closing: Set max-height back to null (or 0 via css, but null allows css to take over)
                    answer.style.maxHeight = null;
                }
            });
        }
    });

});

/**
 * Generates and downloads a vCard (.vcf) file for Treadz Tire & Towing
 */
function downloadvCard() {
    // VCF Format 3.0
    const vCardData = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:;Treadz Tire & Towing;;;',
        'FN:Treadz Tire & Towing',
        'ORG:Treadz Tire & Towing',
        'TEL;TYPE=WORK,VOICE:423-357-4551',
        'EMAIL;TYPE=WORK:treadztnt@gmail.com',
        'ADR;TYPE=WORK:;;409 Main Street;Mount Carmel;TN;37645;USA',
        'URL:https://treadztires.com',
        'NOTE:24/7 Emergency Towing & Tire Repair',
        'END:VCARD'
    ].join('\n');

    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);

    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Treadz_Towing.vcf');
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Scroll Spy for Navigation Active State
// Scroll Spy for Navigation Active State
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('header, section, footer'); // Include header for Home
    const navLinks = document.querySelectorAll('.nav-links a');

    let currentSectionId = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        // -150 to trigger the change slightly before the top of the section hits the top of the viewport
        if (window.pageYOffset >= (sectionTop - 150)) {
            currentSectionId = section.getAttribute('id');
        }
    });

    // Force "Contact" to be active if at the bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        currentSectionId = 'contact';
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        // Check if the link's href matches the current section ID
        if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
        }
    });
});
