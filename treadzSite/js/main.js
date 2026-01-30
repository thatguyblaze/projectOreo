// Treadz Site Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log("Treadz Site Loaded");
    initLocationHighlight();
});

// --- Geolocation & Service Area Highlighting ---
// --- Geolocation & Service Area Highlighting ---
function initLocationHighlight() {
    // USE IP GEOLOCATION (No permission popup required)
    // We use a free IP API to estimate location
    fetch('https://ipwho.is/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const userCity = data.city;
                // console.log("User IP City:", userCity);
                if (userCity) {
                    highlightServiceArea(userCity);
                }
            } else {
                console.log("IP Geolocation failed:", data.message);
            }
        })
        .catch(error => {
            console.error("IP Geolocation error:", error);
        });
}

function highlightServiceArea(city) {
    // Find all tags in the area-tags section
    const tags = document.querySelectorAll('.area-tags .tag');
    let matched = false;

    tags.forEach(tag => {
        // Clean text: "Kingsport, TN" -> "Kingsport"
        const tagText = tag.textContent.split(',')[0].trim().toLowerCase();
        const userCityClean = city.trim().toLowerCase();

        if (tagText === userCityClean) {
            tag.classList.add('active-location');
            tag.innerHTML = `<i class="fa-solid fa-location-arrow" style="margin-right:0.5rem"></i> ${tag.textContent}`;
            matched = true;
        }
    });

    if (matched) {
        // console.log("Matched service area!");
        const areaSection = document.querySelector('.area-tags');
        if (areaSection) {
            const msg = document.createElement('div');
            msg.innerHTML = `<p style="color: var(--accent-color); font-weight: bold; margin-top: 1rem;"><i class="fa-solid fa-check-circle"></i> We serve your area: ${city}!</p>`;
            areaSection.appendChild(msg);
        }
    }
}
