console.log("Sports.js (Minimal) loading...");

window.initSports = function (API) {
    console.log("Sports.js (Minimal) Initializing...");
    const container = document.getElementById('game-sports');
    if (container) {
        container.innerHTML = '<div class="text-center p-10 text-white">Sports Betting Loaded (Minimal Mode)</div>';
    }
};

console.log("Sports.js (Minimal) loaded. window.initSports defined.");
