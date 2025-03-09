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
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
    
                // Store in session storage
                sessionStorage.setItem("userLatitude", latitude);
                sessionStorage.setItem("userLongitude", longitude);
    
                console.log("Location stored:", { latitude, longitude });
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
            { timeout: 10000 } // Timeout after 10 seconds
        );
    };
    
    return (
        <div className="text-center">
            <button type="button" className="btn btn-primary btn-lg" onClick={getLocation}>
                Click me for location
            </button>
            {location.latitude && location.longitude && (
                <p className="mt-3">
                    Your location: <strong>{location.latitude}, {location.longitude}</strong>
                </p>
            )}
            {error && <p className="mt-3 text-danger">{error}</p>}
        </div>
    );
}
