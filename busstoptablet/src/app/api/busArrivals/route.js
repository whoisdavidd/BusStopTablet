import { NextResponse } from "next/server";

// Function to calculate minutes from now
const getMinutesUntilArrival = (arrivalTime) => {
    if (!arrivalTime) return "N/A";

    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMs = arrival - now;
    const diffMinutes = Math.round(diffMs / 60000); // Convert ms to minutes

    return diffMinutes > 0 ? `${diffMinutes} min` : "Arriving Now";
};

// Fetch bus arrivals for a given bus stop
const fetchBusArrivals = async (busStopCode, apiKey) => {
    const BUS_ARRIVAL_API = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`;

    try {
        const response = await fetch(BUS_ARRIVAL_API, {
            headers: {
                "AccountKey": apiKey,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch arrivals for Bus Stop ${busStopCode}`);
            return { error: `Failed to fetch arrivals for Bus Stop ${busStopCode}` };
        }

        const data = await response.json();

        return data.Services.map(service => ({
            ServiceNo: service.ServiceNo,
            NextBus: getMinutesUntilArrival(service.NextBus.EstimatedArrival),
            // Load: service.NextBus.Load,
            Feature: service.NextBus.Feature || "N/A",
            Type: service.NextBus.Type,
        }));
    } catch (error) {
        console.error("❌ Error fetching bus arrivals:", error.message);
        return { error: "Failed to fetch bus arrivals" };
    }
};

export async function GET(req) {
    console.log("🚀 Incoming request to /api/busArrivals");

    const { searchParams } = new URL(req.url);
    const busStopCode = searchParams.get("busStopCode");
    const apiKey = process.env.NEXT_PUBLIC_LTA_ACCOUNT_KEY;

    if (!busStopCode) {
        console.error("❌ Missing Bus Stop Code in request");
        return NextResponse.json({ error: "Missing Bus Stop Code" }, { status: 400 });
    }

    if (!apiKey) {
        console.error("❌ Missing API Key in environment variables");
        return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    try {
        console.log(`🔄 Fetching arrivals for Bus Stop ${busStopCode}...`);
        const busArrivals = await fetchBusArrivals(busStopCode, apiKey);

        return NextResponse.json(busArrivals, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching bus arrivals:", error.message);
        return NextResponse.json({ error: `Failed to fetch bus arrivals: ${error.message}` }, { status: 500 });
    }
}