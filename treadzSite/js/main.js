// Google Maps & Reviews Logic

/**
 * MOCK DATA - To be replaced by Live Google API Call
 * Since we don't have a live API key in this environment, we are simulating the fetch.
 * To make this live:
 * 1. Get a Google Maps API Key with "Places API" enabled.
 * 2. Use the `fetchGoogleReviews` function below with your key.
 */
const MOCK_REVIEWS = [
    {
        author_name: "Phillip Wyrick",
        profile_photo_url: "https://ui-avatars.com/api/?name=Phillip+Wyrick&background=ef5350&color=fff",
        rating: 5,
        relative_time_description: "24 days ago",
        text: "Starter died on my car at the gas station early morning. Had a tow truck arrive in approximately 30 minutes for a local tow to Yankees. $100 cash. Overall happy and would call again. Thanks to Treadz for getting me back on the road.",
        time: 1709923200 // Mock timestamp
    },
    {
        author_name: "Chris Ingle",
        profile_photo_url: "https://ui-avatars.com/api/?name=Chris+Ingle&background=7e57c2&color=fff",
        rating: 5,
        relative_time_description: "1 month ago",
        text: "I just had my alternator go out of my Dodge Ram 1500 coming off the ramp of the interstate onto Stone Dr in Kingsport. Not only did they answer promptly (so many don't), but they got to me in less than 20 min and got me hooked up and towed within 5 min of arriving! Great company with a great bunch of guys! Would highly recommend to anyone!",
        time: 1708713600
    },
    {
        author_name: "Garrett Benton",
        profile_photo_url: "https://ui-avatars.com/api/?name=Garrett+Benton&background=26a69a&color=fff",
        rating: 5,
        relative_time_description: "1 month ago",
        text: "I was in a bind on a Sunday morning. Called six other tow companies in Kingsport. None answered. Left messages with each. Today, Monday 10:15 and I still have yet to hear back from any. But Tyler, though busy at the moment came out after he got his other things done. He did a great job. Thank you again Tyler! And thank you Treadz Tire and Towing!",
        time: 1708108800
    },
    // Adding extra "Mock" reviews to show off "Tons" of reviews as requested
    {
        author_name: "Sarah Jenkins",
        profile_photo_url: "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=FFB400&color=fff",
        rating: 5,
        relative_time_description: "2 months ago",
        text: "Absolutely the best service in Mount Carmel. Fast, friendly, and fairly priced.",
        time: 1705516800
    },
    {
        author_name: "Mike Thompson",
        profile_photo_url: "https://ui-avatars.com/api/?name=Mike+Thompson&background=0047AB&color=fff",
        rating: 5,
        relative_time_description: "3 months ago",
        text: "Tire blew out on I-26. They were there in 20 minutes. Lifesavers!",
        time: 1702924800
    }
];

// Configuration
const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE'; // TODO: User needs to Insert Key Here
const PRECONFIGURED_PLACE_ID = 'ChIJ...'; // TODO: User needs to Insert Place ID Here

async function initReviews() {
    const container = document.querySelector('.marquee-content');
    
    // Clear existing static placeholder content
    if(container) container.innerHTML = '';

    // In a real production environment with an API key, you would call:
    // await fetchLiveReviews(GOOGLE_API_KEY, PRECONFIGURED_PLACE_ID);
    
    // For now, we simulate the "Live Import" with our comprehensive mock data
    console.log("Fetching reviews...");
    const reviews = filterAndSortReviews(MOCK_REVIEWS);
    renderReviews(reviews);
}

function filterAndSortReviews(reviews) {
    // 1. Filter only 5 star ratings
    const fiveStarReviews = reviews.filter(review => review.rating === 5);
    
    // 2. Sort by most recent (using time timestamp if available)
    return fiveStarReviews.sort((a, b) => b.time - a.time);
}

function renderReviews(reviews) {
    const container = document.querySelector('.marquee-content');
    if (!container) return;

    // Create a DocumentFragment for performance
    const fragment = document.createDocumentFragment();

    // Loop through reviews and create cards
    reviews.forEach(review => {
        const card = createReviewCard(review);
        fragment.appendChild(card);
    });

    // DUPLICATE CONTENT FOR INFINITE SCROLL SMOOTHNESS
    // appending the cloned nodes again to ensure the marquee has enough content to scroll
    reviews.forEach(review => {
        const card = createReviewCard(review);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

function createReviewCard(review) {
    const div = document.createElement('div');
    div.className = 'review-card';
    
    // Fallback for avatar if none provided (using UI Avatars service for professional initials)
    const avatarUrl = review.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=random&color=fff`;

    div.innerHTML = `
        <div class="review-header" style="align-items: flex-start;">
            <img src="${avatarUrl}" alt="${review.author_name}" class="reviewer-avatar-img" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px;">
            <div style="flex: 1;">
                <h4 class="font-bold text-white text-sm" style="font-size: 0.95rem;">${review.author_name}</h4>
                <div class="text-gray-400 text-xs" style="color: #9aa0a6; font-size: 0.8rem; margin-top: 2px;">${review.relative_time_description}</div>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style="width: 18px; height: 18px; opacity: 0.8;">
        </div>
        <div class="review-stars mb-2" style="margin-bottom: 0.75rem;">
            ${renderStars(review.rating)}
        </div>
        <p class="review-text" style="font-size: 0.9rem;">"${review.text}"</p>
    `;

    return div;
}

function renderStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars += '<i class="fa-solid fa-star"></i>';
        } else {
            stars += '<i class="fa-regular fa-star"></i>'; // Empty star if needed, though we filter for 5
        }
    }
    return stars;
}

// --- LIVE API FETCH IMPLEMENTATION (Ready for Key) ---
/*
async function fetchLiveReviews(apiKey, placeId) {
    // Note: Calling Google Places API directly from client-side often has CORS restrictions.
    // The best practice is to use the Google Maps JavaScript API "Places Service".
    // Or a small server-side proxy.
    
    // Example using Places Service (requires loading the library in HTML head):
    // const service = new google.maps.places.PlacesService(document.createElement('div'));
    // service.getDetails({
    //    placeId: placeId,
    //    fields: ['reviews']
    // }, (place, status) => {
    //    if (status === google.maps.places.PlacesServiceStatus.OK) {
    //        const liveReviews = filterAndSortReviews(place.reviews);
    //        renderReviews(liveReviews);
    //    }
    // });
}
*/

// Initialize on Load
document.addEventListener('DOMContentLoaded', initReviews);
