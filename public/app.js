if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');
const latSpan = document.getElementById('lat');
const lngSpan = document.getElementById('lng');
const accSpan = document.getElementById('acc');
const timestampSpan = document.getElementById('timestamp');
const logDiv = document.getElementById('log');

let watchId = null;
let isSharing = false;
let lastKnownCoords = null;
let shareIntervalId = null;

toggleBtn.addEventListener('click', () => {
    if (isSharing) {
        stopSharing();
    } else {
        startSharing();
    }
});

function startSharing() {
    if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    isSharing = true;
    updateUI(true);
    
    // Options for high accuracy to get "live" updates more frequently
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
    );

    // Start sending data every 5 seconds
    shareIntervalId = setInterval(() => {
        if (lastKnownCoords) {
            shareLocation(lastKnownCoords);
        }
    }, 5000);
    
    log('Started watching position.');
}

function stopSharing() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (shareIntervalId !== null) {
        clearInterval(shareIntervalId);
        shareIntervalId = null;
    }
    isSharing = false;
    lastKnownCoords = null;
    updateUI(false);
    log('Stopped watching position.');
}

function handleSuccess(position) {
    const coords = position.coords;
    const timestamp = new Date(position.timestamp).toLocaleString();

    latSpan.textContent = coords.latitude.toFixed(6);
    lngSpan.textContent = coords.longitude.toFixed(6);
    accSpan.textContent = coords.accuracy.toFixed(1);
    timestampSpan.textContent = timestamp;

    // Cache the latest coordinates
    lastKnownCoords = coords;
}

function handleError(error) {
    console.error('Geolocation error:', error);
    let msg = '';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            msg = 'User denied the request for Geolocation.';
            break;
        case error.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            msg = 'The request to get user location timed out.';
            break;
        case error.UNKNOWN_ERROR:
            msg = 'An unknown error occurred.';
            break;
    }
    log('Error: ' + msg);
    // If permission denied or fatal error, maybe stop sharing
    if (error.code === error.PERMISSION_DENIED) {
        stopSharing();
    }
}

function updateUI(sharing) {
    if (sharing) {
        toggleBtn.textContent = 'Stop Sharing';
        toggleBtn.classList.add('sharing');
        statusText.textContent = 'Sharing...';
        statusText.style.color = 'green';
    } else {
        toggleBtn.textContent = 'Start Sharing';
        toggleBtn.classList.remove('sharing');
        statusText.textContent = 'Stopped';
        statusText.style.color = '#333';
    }
}

function shareLocation(coords) {
    // This is where you would make an API call to your backend
    // Replace http://localhost:3000/location with your actual backend URL
    fetch('https://kiddingly-supercarpal-trenton.ngrok-free.dev', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lat: coords.latitude,
            lng: coords.longitude,
            timestamp: Date.now()
        })
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to send location');
        }
    }).catch(error => {
        console.error('Error sending location:', error);
    });
    
    console.log(`Sending location: ${coords.latitude}, ${coords.longitude}`);
    // Optional: Log to UI that we sent it
    // log(`Sent: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
}

function log(message) {
    const p = document.createElement('p');
    p.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logDiv.prepend(p);
}
