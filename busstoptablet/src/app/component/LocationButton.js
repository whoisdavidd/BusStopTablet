"use client";
import { useState } from "react";

export default function LocationButton() {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [error, setError] = useState(null);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }
    
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const address = await getNearestLocation(latitude, longitude);
                    setLocation({ latitude, longitude, address });

                    // Store in session storage
                    sessionStorage.setItem("userLatitude", latitude);
                    sessionStorage.setItem("userLongitude", longitude);
                    sessionStorage.setItem("userAddress", address);

                    console.log("Stored location:", { latitude, longitude, address });
                } catch (err) {
                    setError("Could not fetch nearest location.");
                }
            },
            (err) => {
                console.error("Geolocation error:", err);

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError("Location access denied. Please enable location services in your browser.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError("Location information is unavailable.");
                        break;
                    case err.TIMEOUT:
                        setError("Request timed out. Try again.");
                        break;
                    default:
                        setError("An unknown error occurred.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };
    const getNearestLocation = async (lat, lon) => {
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // 🔥 Replace this with your real API key
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("Google Maps API Response:", data); // 🔥 Debugging
            
            if (data.status === "OK" && data.results.length > 0) {
                return data.results[0].formatted_address; // Get the nearest readable address
            } else {
                return "Unknown location";
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            return "Error fetching location";
        }
    };

    return (
        <div className="text-center">
            <button type="button" className="btn btn-primary btn-lg" onClick={getLocation}>
                Click me for location
            </button>
            {location.address && (
                <p className="mt-3">
                    <strong>Nearest Location: {location.address}</strong>
                </p>
            )}
            {error && <p className="mt-3 text-danger">{error}</p>}
        </div>
    );
}