document.addEventListener('DOMContentLoaded', () => {
    // 1. Find the main navigation container
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    // 2. Find the container with the links (usually hidden on mobile)
    // It's the one with 'hidden md:flex'
    const desktopLinksContainer = nav.querySelector('.hidden.md\\:flex');
    if (!desktopLinksContainer) return;

    // 3. Create Hamburger Button
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'md:hidden text-white p-2 focus:outline-none mr-2'; // Added margin-right
    hamburgerBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    `;

    // 4. Create Mobile Menu Container
    const mobileMenu = document.createElement('div');
    mobileMenu.id = 'mobile-menu';
    mobileMenu.className = 'fixed inset-0 bg-gray-900 bg-opacity-95 z-[60] transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col pt-20 px-6'; // z-[60] to be above everything
    
    // Close button for mobile menu
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-6 right-6 text-white p-2';
    closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    `;
    closeBtn.onclick = () => {
        mobileMenu.classList.add('translate-x-full');
        document.body.style.overflow = ''; // Restore scrolling
    };
    mobileMenu.appendChild(closeBtn);

    // 5. Clone Links
    const links = desktopLinksContainer.querySelectorAll('a');
    links.forEach(link => {
        const mobileLink = link.cloneNode(true);
        mobileLink.className = 'text-white text-2xl font-bold py-6 border-b border-gray-700 block text-center hover:text-blue-400 transition-colors';
        
        // Check if active
        if (link.classList.contains('active')) {
            mobileLink.classList.add('text-blue-500');
        }

        mobileLink.onclick = () => {
             // Close menu when clicked
             mobileMenu.classList.add('translate-x-full');
             document.body.style.overflow = '';
        };
        mobileMenu.appendChild(mobileLink);
    });

    // 6. Append elements
    document.body.appendChild(mobileMenu);
    
    // Insert hamburger before the Logo container
    // Structure: <div class="flex items-center gap-8"> (Left Container)
    const leftContainer = nav.querySelector('.flex.items-center.gap-8') || nav.querySelector('.flex.items-center.gap-4');
    if (leftContainer) {
         leftContainer.insertBefore(hamburgerBtn, leftContainer.firstChild);
    }

    // 7. Toggle Logic
    hamburgerBtn.onclick = () => {
        mobileMenu.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };
});
