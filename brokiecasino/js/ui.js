function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    document.querySelectorAll('.accordion-content').forEach(c => {
        c.style.maxHeight = '0px';
        c.classList.remove('open');
        if (c.previousElementSibling) c.previousElementSibling.querySelector('span:last-child').innerText = '+';
    });

    if (!isOpen) {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.add('open');
        button.querySelector('span:last-child').innerText = '−';
    }
}
