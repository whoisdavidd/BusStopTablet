import { NextResponse } from "next/server";

// Haversine Formula for calculating distance (KM)
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
  console.log("🚀 Incoming request to /api/busStops");

  const { searchParams } = new URL(req.url);
  const userLat = parseFloat(searchParams.get("lat"));
  const userLon = parseFloat(searchParams.get("lon"));

  console.log("📍 Received lat:", userLat, "lon:", userLon);

  if (!userLat || !userLon) {
    console.error("❌ Missing latitude or longitude in request");
    return NextResponse.json(
      { error: "Missing latitude or longitude" },
      { status: 400 }
    );
  }

  const API_URL = "https://datamall2.mytransport.sg/ltaodataservice/BusStops";
  const API_KEY = process.env.NEXT_PUBLIC_LTA_ACCOUNT_KEY;

  if (!API_KEY) {
    console.error("❌ Missing API Key in environment variables");
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    console.log("🔄 Fetching all bus stops from LTA API...");
    const response = await fetch(API_URL, {
      headers: {
        AccountKey: API_KEY,
        Accept: "application/json",
      },
    });

    console.log("📡 Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ LTA API Error Response:", errorText);
      throw new Error(`API request failed with status: ${response.status}`);
    }
    const data = await response.json();

if (!data || !data.value) {
    throw new Error("Invalid API response: 'value' key is missing");
}
    const nearbyBusStops = response.value
      .map((busStop) => {
        const busLat = parseFloat(busStop.Latitude);
        const busLon = parseFloat(busStop.Longitude);

        if (isNaN(busLat) || isNaN(busLon)) {
          console.warn(
            `⚠️ Skipping bus stop ${busStop.BusStopCode} due to missing coordinates`
          );
          return null;
        }

        const distance = getDistance(userLat, userLon, busLat, busLon);

        return {
          BusStopCode: busStop.BusStopCode,
          RoadName: busStop.RoadName,
          Description: busStop.Description,
          Latitude: busLat,
          Longitude: busLon,
          Distance: distance !== null ? distance.toFixed(2) : "N/A",
        };
      })
      .filter(
        (busStop) =>
          busStop !== null &&
          busStop.Distance !== "N/A" &&
          busStop.Distance < 1.5
      )
      .sort((a, b) => a.Distance - b.Distance);

    console.log("🚏 Nearby Bus Stops Found:", nearbyBusStops.length);

    return NextResponse.json(nearbyBusStops, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching bus stops:", error.message);
    return NextResponse.json(
      { error: `Failed to fetch bus stops: ${error.message}` },
      { status: 500 }
    );
  }
}
