import { NextResponse } from "next/server";

// ✅ Haversine Formula for Distance Calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.warn("⚠️ Invalid coordinates, skipping");
        return null;
    }

    const R = 6371; // Radius of Earth in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
};

// ✅ Fetch All Bus Stops from LTA API (Handles Pagination)
const fetchAllBusStops = async () => {
  let allBusStops = [];
  let skip = 0;
  const API_URL = "https://datamall2.mytransport.sg/ltaodataservice/BusStops";
  const API_KEY = process.env.NEXT_PUBLIC_LTA_ACCOUNT_KEY;

  while (true) {
      console.log(`🔄 Fetching bus stops (Skip: ${skip})...`);
      const response = await fetch(`${API_URL}?$skip=${skip}`, {
          headers: {
              "AccountKey": API_KEY,
              "Accept": "application/json",
          },
      });

      if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.value || data.value.length === 0) break; // 🚀 Stop fetching if no more results

      allBusStops = [...allBusStops, ...data.value];
      skip += 500; // Move to the next batch
  }

  console.log(`✅ Total Bus Stops Fetched: ${allBusStops.length}`);
  return allBusStops;
};
// ✅ Main GET Route to Return Nearby Bus Stops
export async function GET(req) {
    console.log("🚀 Incoming request to /api/busStops");

    const { searchParams } = new URL(req.url);
    const userLat = parseFloat(searchParams.get("lat"));
    const userLon = parseFloat(searchParams.get("lon"));

    console.log("📍 Received lat:", userLat, "lon:", userLon);

    if (!userLat || !userLon) {
        console.error("❌ Missing latitude or longitude in request");
        return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
    }

    // ✅ Fetch ALL Bus Stops
    const allBusStops = await fetchAllBusStops();

    if (allBusStops.length === 0) {
        return NextResponse.json({ error: "No bus stops found" }, { status: 500 });
    }

    // ✅ Filter Nearby Bus Stops (Within 1.5 KM)
    const nearbyBusStops = allBusStops
        .map(busStop => {
            const busLat = parseFloat(busStop.Latitude);
            const busLon = parseFloat(busStop.Longitude);

            if (isNaN(busLat) || isNaN(busLon)) {
                console.warn(`⚠️ Skipping bus stop ${busStop.BusStopCode} due to missing coordinates`);
                return null;
            }

            const distance = calculateDistance(userLat, userLon, busLat, busLon);
            return {
                BusStopCode: busStop.BusStopCode,
                RoadName: busStop.RoadName,
                Description: busStop.Description,
                Latitude: busLat,
                Longitude: busLon,
                Distance: isNaN(distance) ? null : parseFloat(distance.toFixed(2)),
            };
        })
        .filter(busStop => busStop !== null && busStop.Distance !== null && busStop.Distance < 0.5)
        .sort((a, b) => a.Distance - b.Distance);

    console.log("🚏 Nearby Bus Stops Found:", nearbyBusStops.length);
    return NextResponse.json(nearbyBusStops, { status: 200 });
}