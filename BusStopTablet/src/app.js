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

// API Keys
const LTA_ACCOUNT_KEY = import.meta.env.VITE_LTA_ACCOUNT_KEY;
const ONEMAP_TOKEN = import.meta.env.VITE_ONEMAP_TOKEN;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const findBusesPostalCodeInput = document.getElementById("findBusesPostalCode");
const findBusesBtn = document.getElementById("findBusesBtn");
const nearbyBusStopsList = document.getElementById("nearbyBusStops");

// Login/Register Buttons
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Handle User Registration
registerBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created! Please log in.");
    } catch (error) {
        console.error("Registration error:", error.message);
    }
});

// ✅ Handle User Login
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
    } catch (error) {
        console.error("Login error:", error.message);
    }
});

// ✅ Handle Logout
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out successfully!");
});

// ✅ Fetch Bus Stops by Address or Bus Stop Code
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return alert("Enter a bus stop number or address!");

    if (/^\d+$/.test(query)) {
        getBusArrivals(query);
    } else {
        getBusStops(query);
    }
});

// ✅ Fetch Bus Stops by Address
const getBusStops = async (address) => {
    const response = await fetch("https://datamall2.mytransport.sg/ltaodataservice/BusStops", {
        headers: { AccountKey: LTA_ACCOUNT_KEY }
    });
    const data = await response.json();

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

// ✅ Fetch Bus Arrivals for a Given Bus Stop Code
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
        </div>`
    ).join("");
};

// ✅ Find Buses Near Postal Code
findBusesBtn.addEventListener("click", async () => {
    const postalCode = findBusesPostalCodeInput.value.trim();
    if (!postalCode) return alert("Enter a postal code!");

    const coords = await getCoordinatesFromPostalCode(postalCode);
    if (!coords) return;

    const nearbyStops = await getNearbyBusStops(coords.lat, coords.lon);
    if (nearbyStops.length === 0) return alert("No bus stops found nearby!");

    // Display Nearby Bus Stops
    nearbyBusStopsList.innerHTML = nearbyStops.map(stop => 
        `<li>${stop.Description} (${stop.BusStopCode}) 
        <button onclick="getBusArrivals('${stop.BusStopCode}')">Check Bus Arrivals</button>
        </li>`
    ).join("");
});

// ✅ Get Coordinates from Postal Code
const getCoordinatesFromPostalCode = async (postalCode) => {
    const response = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y&pageNum=1`);
    const data = await response.json();

    if (data.results.length === 0) {
        alert("Invalid Postal Code!");
        return null;
    }

    return {
        lat: parseFloat(data.results[0].LATITUDE),
        lon: parseFloat(data.results[0].LONGITUDE)
    };
};

// ✅ Get Nearby Bus Stops (Filtering by 500m)
const getNearbyBusStops = async () => {
    try {
        const response = await fetch("http://localhost:4000/api/bus-stops"); // ✅ Use Proxy
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Bus Stops Data:", data);
    } catch (error) {
        console.error("Failed to fetch bus stops:", error);
    }
};

// Call Function When Button is Clicked
document.getElementById("findBusesBtn").addEventListener("click", getNearbyBusStops);

// ✅ Haversine Formula to Calculate Distance
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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