// Google Maps & Reviews Logic

// NOTE: We have switched to using a 3rd Party Widget (Elfsight) for handling reviews
// to allow for Free, Live updates without complex API management.
// See index.html lines 85+ for where to paste the widget code.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Treadz Site Loaded");
    // visual effects or other logic can go here
});


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
