// Import Firebase & Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Firebase Config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// API Key for LTA
const LTA_ACCOUNT_KEY = import.meta.env.VITE_LTA_ACCOUNT_KEY;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");

// Search for Bus Stops by Address or Bus Stop Code
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return alert("Enter a bus stop number or address!");

    if (/^\d+$/.test(query)) {
        // If the query is a bus stop code, fetch arrivals
        getBusArrivals(query);
    } else {
        // If it's an address, search bus stops
        getBusStops(query);
    }
});

// Fetch Bus Stops by Address
const getBusStops = async (address) => {
    const response = await fetch("https://datamall2.mytransport.sg/ltaodataservice/BusStops", {
        headers: { AccountKey: LTA_ACCOUNT_KEY }
    });
    const data = await response.json();

    // Filter bus stops that match the address
    const matchingStops = data.value.filter(busStop => 
        busStop.Description.toLowerCase().includes(address.toLowerCase()) || 
        busStop.RoadName.toLowerCase().includes(address.toLowerCase())
    );

    if (matchingStops.length === 0) {
        alert("No bus stops found for this address.");
        return;
    }

    resultsDiv.innerHTML = matchingStops.map(stop =>
        `<div>
            <p>Bus Stop: ${stop.BusStopCode} - ${stop.Description} (${stop.RoadName})</p>
            <button onclick="getBusArrivals('${stop.BusStopCode}')">Check Bus Arrivals</button>
        </div>`
    ).join("");
};

// Fetch Bus Arrivals for a Given Bus Stop Code
const getBusArrivals = async (busStopCode) => {
    const response = await fetch(`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`, {
        headers: { AccountKey: LTA_ACCOUNT_KEY }
    });
    const data = await response.json();

    if (!data.Services || data.Services.length === 0) {
        alert("No buses found at this stop.");
        return;
    }

    resultsDiv.innerHTML = data.Services.map(bus =>
        `<div>
            <p>Bus: ${bus.ServiceNo} | Arriving: ${bus.NextBus.EstimatedArrival}</p>
            <button onclick="addToFavorites('${busStopCode}', '${bus.ServiceNo}')">⭐ Bookmark</button>
        </div>`
    ).join("");
};

// Add Bus to Favorites
const addToFavorites = async (busStopId, busNumber) => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in to save favorites!");

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { favorites: firebase.firestore.FieldValue.arrayUnion({ busStopId, busNumber }) }, { merge: true });
    alert("Added to Favorites!");
};
const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registered:", userCredential.user);
        alert("Account created! Please log in.");
    } catch (error) {
        console.error("Registration error:", error.message);
    }
});

const postalCodeInput = document.getElementById("postalCodeInput");
const findBusesBtn = document.getElementById("findBusesBtn");
const nearbyBusStopsList = document.getElementById("nearbyBusStops");

// Get Coordinates from Postal Code (OneMap API)
const getCoordinatesFromPostalCode = async (postalCode) => {
    const response = await fetch(`https://developers.onemap.sg/commonapi/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y`);
    const data = await response.json();

    if (data.results.length === 0) {
        console.warn("Invalid Postal Code!");
        return null;
    }

    return {
        lat: parseFloat(data.results[0].LATITUDE),
        lon: parseFloat(data.results[0].LONGITUDE)
    };
};
const getAddressFromCoordinates = async (latitude, longitude) => {
    const accessToken = import.meta.env.VITE_ONEMAP_TOKEN; // Get token from .env

    if (!accessToken) {
        console.error("OneMap Access Token is missing. Check your .env file.");
        return null;
    }

    const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${latitude},${longitude}&token=${accessToken}&buffer=50&addressType=All`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.GeocodeInfo.length > 0) {
            console.log("Nearest Address:", data.GeocodeInfo[0].BUILDINGNAME || data.GeocodeInfo[0].ROAD);
            return data.GeocodeInfo[0].BUILDINGNAME || data.GeocodeInfo[0].ROAD;
        } else {
            console.warn("No address found for these coordinates.");
            return "No address found";
        }
    } catch (error) {
        console.error("Error fetching reverse geocode:", error);
        return null;
    }
};
const getNearbyBusStops = async (lat, lon) => {
    const response = await fetch("https://datamall2.mytransport.sg/ltaodataservice/BusStops", {
        headers: { AccountKey: LTA_ACCOUNT_KEY }
    });
    const data = await response.json();
    const busStops = data.value;

    // Calculate distance and filter for stops within 500m
    const nearbyStops = busStops.filter((stop) => {
        const distance = getDistanceFromLatLonInKm(lat, lon, stop.Latitude, stop.Longitude);
        return distance <= 0.5; // 500 meters
    });

    return nearbyStops;
};

// Haversine Formula to Calculate Distance Between Coordinates
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's Radius in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Handle "Find Buses Near Me" Button Click
findBusesBtn.addEventListener("click", async () => {
    const postalCode = postalCodeInput.value.trim();
    if (!postalCode) return alert("Enter a postal code!");

    const coords = await getCoordinatesFromPostalCode(postalCode);
    if (!coords) return;

    const nearbyStops = await getNearbyBusStops(coords.lat, coords.lon);
    if (nearbyStops.length === 0) return alert("No bus stops found nearby!");

    // Display Nearby Bus Stops
    nearbyBusStopsList.innerHTML = nearbyStops.map(stop => 
        `<li>
            ${stop.Description} (${stop.BusStopCode}) 
            <button onclick="getBusArrivals('${stop.BusStopCode}')">Check Bus Arrivals</button>
        </li>`
    ).join("");
});

