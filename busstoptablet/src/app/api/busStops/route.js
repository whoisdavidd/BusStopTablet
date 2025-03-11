import { NextResponse } from "next/server";

// ✅ Define function **before** using it
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  console.log("📍 Calculating distance between:", lat1, lon1, "➡️", lat2, lon2);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.warn("⚠️ Invalid coordinates, returning null");
    return null;
  }

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
    console.log("📦 Data Received:", data.value);

    console.log("✅ Total Bus Stops Received:", data.value.length);

    // ✅ Process all bus stops and calculate distance
    const nearbyBusStops = data.value
      .map((busStop) => {
        const busLat = parseFloat(busStop.Latitude);
        const busLon = parseFloat(busStop.Longitude);

        if (isNaN(busLat) || isNaN(busLon)) {
          console.warn(
            `⚠️ Skipping bus stop ${busStop.BusStopCode} due to missing coordinates`
          );
          return null;
        }

        const distance = calculateDistance(userLat, userLon, busLat, busLon);
        console.log(
          `🚏 Bus Stop: ${busStop.BusStopCode} | Distance: ${distance?.toFixed(
            2
          )} km`
        ); // ✅ Debugging

        return {
          BusStopCode: busStop.BusStopCode,
          RoadName: busStop.RoadName,
          Description: busStop.Description,
          Latitude: busLat,
          Longitude: busLon,
          Distance: isNaN(distance) ? null : parseFloat(distance.toFixed(2)),
        };
      })
      .filter(
        (busStop) =>
          busStop !== null && busStop.Distance !== null && busStop.Distance < 1.5
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