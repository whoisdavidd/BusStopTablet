"use client";
import { useState } from "react";

export default function BusArrivalCard() {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [busStops, setBusStops] = useState([]);
    const [error, setError] = useState(null);

    // Function to get user's location
    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });

                console.log("Stored location:", { latitude, longitude });

                // Fetch nearest bus stops from Next.js API
                await fetchNearestBusStops(latitude, longitude);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Could not fetch location. Please enable location services.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Function to fetch nearest bus stops via Next.js API
    const fetchNearestBusStops = async (lat, lon) => {
        if (!lat || !lon) {
            console.error("Latitude or Longitude is missing!");
            setError("Could not determine location.");
            return;
        }
    
        console.log(`Sending request to /api/busStops?lat=${lat}&lon=${lon}`);
    
        try {
            const response = await fetch(`/api/busStops?lat=${lat}&lon=${lon}`);
    
            console.log("Response Status:", response.status);
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error(`API request failed with status ${response.status}`);
            }
    
            const data = await response.json();
    
            console.log("Nearby Bus Stops:", data);
    
            if (Array.isArray(data) && data.length > 0) {
                setBusStops(data);
            } else {
                setError("No nearby bus stops found.");
            }
        } catch (error) {
            console.error("Error fetching bus stops:", error);
            setError("Could not fetch nearby bus stops. Try again.");
        }
    };

    return (
        <div className="container text-center">
            <button type="button" className="btn btn-primary btn-lg" onClick={getLocation}>
                Find Nearby Bus Stops
            </button>

            {error && <p className="mt-3 text-danger">{error}</p>}

            {busStops.length > 0 && (
                <div className="row mt-4">
                    {busStops.map((busStop, index) => (
                        <div key={index} className="col-md-6">
                            <div className="card shadow-sm mb-3">
                                <div className="card-body">
                                    <h5 className="card-title">Bus Stop: {busStop.BusStopCode}</h5>
                                    <p><strong>{busStop.Description}</strong> ({busStop.RoadName})</p>
                                    <p><strong>Distance:</strong> {busStop.Distance.toFixed(2)} km</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}