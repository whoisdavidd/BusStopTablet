import { NextResponse } from "next/server";

// Haversine Formula to calculate distance (KM)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
};

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userLat = parseFloat(searchParams.get("lat"));
    const userLon = parseFloat(searchParams.get("lon"));

    if (!userLat || !userLon) {
        return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
    }

    const API_URL = "https://datamall2.mytransport.sg/ltaodataservice/BusStops";
    const API_KEY = process.env.NEXT_PUBLIC_LTA_ACCOUNT_KEY;

    try {
        console.log("Fetching bus stops from LTA API...");
        const response = await fetch(API_URL, {
            headers: {
                "AccountKey": API_KEY,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Total Bus Stops Received:", data.value.length);

        // Filter nearest bus stops (within 1KM)
        const nearbyBusStops = data.value
            .map(busStop => ({
                BusStopCode: busStop.BusStopCode,
                RoadName: busStop.RoadName,
                Description: busStop.Description,
                Latitude: parseFloat(busStop.Latitude),
                Longitude: parseFloat(busStop.Longitude),
                Distance: getDistance(userLat, userLon, parseFloat(busStop.Latitude), parseFloat(busStop.Longitude)),
            }))
            .filter(busStop => busStop.Distance < 1.5) // ✅ Increased radius from 1.0KM to 1.5KM
            .sort((a, b) => a.Distance - b.Distance); // Sort closest first

        console.log("Nearby Bus Stops Found:", nearbyBusStops.length);
        console.log("Bus Stops:", nearbyBusStops);

        return NextResponse.json(nearbyBusStops, { status: 200 });
    } catch (error) {
        console.error("Error fetching bus stops:", error.message);
        return NextResponse.json({ error: `Failed to fetch bus stops: ${error.message}` }, { status: 500 });
    }
}