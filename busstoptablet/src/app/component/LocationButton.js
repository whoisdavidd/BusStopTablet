"use client";
import { useState, useEffect } from "react";

export default function BusArrivalCard() {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [busStops, setBusStops] = useState([]);
    const [busArrivals, setBusArrivals] = useState({});
    const [error, setError] = useState(null);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }
    
        // 🚀 Use watchPosition to continuously track location updates
        const geoWatch = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
    
                console.log("📍 Updated location:", { latitude, longitude });
    
                // ✅ Immediately stop watching after getting new position
                navigator.geolocation.clearWatch(geoWatch);
    
                await fetchNearestBusStops(latitude, longitude);
            },
            (error) => {
                console.error("❌ Geolocation error:", error);
    
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError("❌ Location access denied. Enable location in browser settings.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError("⚠️ Location unavailable. Try again later.");
                        break;
                    case error.TIMEOUT:
                        setError("⏳ Location request timed out.");
                        break;
                    default:
                        setError("❗ An unknown error occurred.");
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // ✅ Forces new GPS fetch
        );
    };

    const fetchNearestBusStops = async (lat, lon) => {
        // 🔥 Clear previous results before fetching new ones
        setBusStops([]);
        setError(null);
    
        console.log(`📡 Fetching nearby bus stops for lat=${lat}, lon=${lon}`);
    
        try {
            const response = await fetch(`/api/busStops?lat=${lat}&lon=${lon}`);
            const data = await response.json();
    
            console.log("🚏 Nearby Bus Stops:", data);
            setBusStops(data);
    
            if (data.length > 0) {
                fetchBusArrivalsForStops(data.map(stop => stop.BusStopCode));
            } else {
                setError("⚠️ No nearby bus stops found.");
            }
        } catch (error) {
            console.error("❌ Error fetching bus stops:", error);
            setError("Could not fetch nearby bus stops.");
        }
    };

    const fetchBusArrivalsForStops = async (busStopCodes) => {
        try {
            const arrivalsData = {};
    
            const fetchPromises = busStopCodes.map(async (busStopCode) => {
                const response = await fetch(`/api/busArrivals?busStopCode=${busStopCode}`);
                const data = await response.json();
                arrivalsData[busStopCode] = data;
            });
    
            await Promise.all(fetchPromises);
    
            console.log("🚌 Bus Arrivals:", arrivalsData);
            setBusArrivals(arrivalsData);
        } catch (error) {
            console.error("❌ Error fetching bus arrivals:", error);
            setError("Could not fetch bus arrival data.");
        }
    };
    useEffect(() => {
        // Trigger immediately on load
        getLocation();

        const interval = setInterval(() => {
            console.log("🔄 Auto-refreshing location & bus arrivals...");
            getLocation();
        }, 30000); // 60,000 ms = 1 minute

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);


    return (
        <div key={`${location.latitude}-${location.longitude}`} className="container text-center">
            <button type="button" className="btn btn-primary btn-lg" onClick={getLocation}>
                Find Nearby Bus Stops
            </button>

            {error && <p className="mt-3 text-danger">{error}</p>}

            {busStops.length > 0 && (
                <div className="row mt-4">
                    {busStops.map((busStop, index) => (
                        <div key={index} className="col-md-6 d-flex align-items-stretch">
                            <div className="card border-0 shadow-lg mb-4 w-100" style={{ borderRadius: "12px" }}>
                                <div className="card-body">
                                    <h5 className="card-title">🚏 Bus Stop: {busStop.BusStopCode}</h5>
                                    <p><strong>{busStop.Description}</strong> ({busStop.RoadName})</p>
                                    <p><strong>Distance:</strong> {busStop.Distance.toFixed(2)} km</p>

                                    {busArrivals[busStop.BusStopCode] ? (
                                        <div>
                                            <h6>🚌 Incoming Buses:</h6>
                                            {busArrivals[busStop.BusStopCode].map((bus, i) => (
                                                <p key={i}>
                                                    <strong>Bus {bus.ServiceNo}:</strong> 
                                                    {" "} {bus.NextBus}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>⏳ Loading bus arrival times...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}