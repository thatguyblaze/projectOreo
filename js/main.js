const projects = [
    {
        title: "Brokie Casino",
        images: ["images/brokiecasino1.png"],
        description: "Built for pure, frictionless entertainment away from pay-to-win junk. Logic-driven interface project built for low-stress interaction.",
        link: "https://blazinik.com/brokiecasino/",
        tags: ["Logic UX", "Systems", "React"],
        thumbnail: "images/brokiecasino1.png"
    },
    {
        title: "Project Space",
        images: ["images/gsp1.png", "images/gsp2.jpeg", "images/gsp3.jpeg", "images/gsp4.png", "images/gsp5.png"],
        description: "Massive environment synthesis project centered on high-poly asset creation, procedural mission logic, and an immersive atmosphere.",
        link: "#",
        tags: ["3D Environment", "Lua Logic", "VFX"],
        thumbnail: "images/gsp1.png"
    },
    {
        title: "Stargate: Horizon",
        images: ["images/pS1.png", "images/pS2.jpeg", "images/pS3.png"],
        description: "Deep science-fiction simulation focusing on technical UI design and custom physics engine integration.",
        link: "https://www.roblox.com/games/3901984129/Stargate-Horizons",
        tags: ["Physics", "Systems UI", "Roblox"],
        thumbnail: "images/pS1.png"
    },
    {
        title: "Franklin's Estate",
        images: ["images/pR1.png", "images/pR2.png", "images/pR3.png", "images/pR4.png"],
        description: "A precision architectural modeling exercise. Recreating GTA V environments for high-fidelity rendering.",
        link: "#",
        tags: ["Architecture", "Modeling", "PBR"],
        thumbnail: "images/pR1.png"
    }
];

let pIdx = 0;
let imgIdx = 0;

const scImg = document.getElementById('sc-img');
const scTitle = document.getElementById('sc-title');
const scDesc = document.getElementById('sc-desc');
const scTags = document.getElementById('sc-tags');
const scLink = document.getElementById('sc-link');
const scCounter = document.getElementById('sc-counter');
const thumbGrid = document.getElementById('thumb-grid');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');

function initGrid() {
    thumbGrid.innerHTML = '';
    projects.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = `glass-card p-2.5 rounded cursor-pointer transition-all ${idx === pIdx ? 'border-indigo-500 scale-105 bg-indigo-500/5' : 'opacity-40 hover:opacity-100'}`;
        item.innerHTML = `
            <img src="${p.thumbnail}" class="w-full h-24 object-cover rounded mb-2 shadow-lg" onerror="this.src='https://placehold.co/400x300/0c1117/6366f1?text=Error'">
            <p class="text-[8px] font-black text-center uppercase tracking-widest text-slate-500">${p.title}</p>
        `;
        item.onclick = () => { pIdx = idx; imgIdx = 0; update(); initGrid(); };
        thumbGrid.appendChild(item);
    });
}

function update() {
    const p = projects[pIdx];
    scImg.style.opacity = '0';
    setTimeout(() => {
        scImg.src = p.images[imgIdx];
        scTitle.innerText = p.title;
        scDesc.innerText = p.description;
        scLink.style.display = p.link === '#' ? 'none' : 'flex';
        scLink.href = p.link;
        scTags.innerHTML = p.tags.map(t => `<span class="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold text-indigo-400 rounded uppercase tracking-wider">${t}</span>`).join('');
        scCounter.innerText = `${(imgIdx + 1).toString().padStart(2, '0')} / ${p.images.length.toString().padStart(2, '0')}`;
        document.getElementById('prev').disabled = imgIdx === 0;
        document.getElementById('next').disabled = imgIdx === p.images.length - 1;
        scImg.style.opacity = '1';
    }, 300);
}

document.getElementById('prev').onclick = (e) => { e.stopPropagation(); if (imgIdx > 0) { imgIdx--; update(); } };
document.getElementById('next').onclick = (e) => { e.stopPropagation(); if (imgIdx < projects[pIdx].images.length - 1) { imgIdx++; update(); } };

function copyToClipboard(text, btnId) {
    const temp = document.createElement('input');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);

    const btn = document.getElementById(btnId);
    const originalText = btn.innerText;
    btn.innerText = "COPIED!";
    btn.classList.add('bg-emerald-600', 'text-white');
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-emerald-600', 'text-white');
    }, 2000);
}

document.getElementById('open-modal-trigger').onclick = () => {
    modalImg.src = scImg.src;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('opacity-100'), 10);
    document.body.style.overflow = 'hidden';
};

document.getElementById('close-modal').onclick = () => {
    modal.classList.remove('opacity-100');
    setTimeout(() => modal.classList.add('hidden'), 300);
    document.body.style.overflow = 'auto';
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-reveal').forEach(el => observer.observe(el));

window.onload = () => { initGrid(); update(); };
