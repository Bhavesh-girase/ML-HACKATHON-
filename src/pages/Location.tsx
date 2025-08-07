declare global {
  interface Window {
    puter: any;
  }
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";


import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Location = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [panelWattage, setPanelWattage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const defaultLat = 20.5937; // India center
  const defaultLon = 78.9629;

  const roundCoord = (value: number) => parseFloat(value.toFixed(6));

  





  const geocodeCity = async (cityName: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cityName
    )}&limit=1&addressdetails=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.length) throw new Error("Location not found");

    const loc = data[0];
    console.log("Geocoding result:", loc);
    return {
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
      city:
        loc.address?.city ||
        loc.address?.town ||
        loc.address?.village ||
        cityName,
    };
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Reverse geocode result:", data);
    return {
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        "Live Location",
    };
  };

const processLocation = async (
  lat: number,
  lon: number,
  cityName: string
) => {
  const config = {
    latitude: lat,
    longitude: lon,
    panelWattage: parseFloat(panelWattage),
  };

  console.log("Sending config to API:", config);
  localStorage.setItem("solarConfig", JSON.stringify(config));
  toast.success("Location and configuration saved!");

  try {
    const response = await fetch("https://ml-2-fqu3.onrender.com/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lat: config.latitude,
        lon: config.longitude,
        kwp: config.panelWattage,
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const result = await response.json();

    // ✅ Check and log the arrays
    const { ac_hourly, dc_hourly } = result;
    console.log("AC hourly data:", ac_hourly);
    console.log("DC hourly data:", dc_hourly);

    // ✅ Save both arrays to localStorage
    localStorage.setItem(
      "geminiPrediction",
      JSON.stringify({
        ac_hourly,
        dc_hourly,
      })
    );

    // ✅ Navigate to /results
    navigate("/results");
  } catch (err) {
    console.error("API prediction error:", err);
    toast.error("Failed to get prediction from model");
  }
};

  const handleLocationSubmit = async () => {
    if (!panelWattage)
      return toast.error("Panel config required");
    if (!latitude || !longitude) return toast.error("Location required");

    setLoading(true);
    try {
      await processLocation(latitude, longitude, city);
    } catch (err) {
      console.error("Prediction processing error:", err);
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCitySubmit = async () => {
    if (!city.trim()) return toast.error("Enter a city name");
    setLoading(true);
    try {
      const loc = await geocodeCity(city.trim());
      const lat = roundCoord(loc.lat);
      const lon = roundCoord(loc.lon);
      setLatitude(lat);
      setLongitude(lon);
      setCity(loc.city);
      toast.success(`City resolved: ${loc.city}`);
    } catch (err) {
      console.error("Geocoding error:", err);
      toast.error("Failed to resolve city");
    } finally {
      setLoading(false);
    }
  };

  const handleLiveLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = roundCoord(pos.coords.latitude);
        const lon = roundCoord(pos.coords.longitude);
        console.log("Live location obtained:", {
          lat,
          lon,
          accuracy: pos.coords.accuracy,
        });
        try {
          const loc = await reverseGeocode(lat, lon);
          setLatitude(lat);
          setLongitude(lon);
          setCity(loc.city);
          toast.success(`Live location: ${loc.city}`);
        } catch (err) {
          console.error("Live location reverse geocode error:", err);
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error("Live location error:", err);
        toast.error("Live location failed");
        setLocationLoading(false);
      }
    );
  };

  const handleMapClick = async (lat: number, lon: number) => {
    const roundedLat = roundCoord(lat);
    const roundedLon = roundCoord(lon);
    setLatitude(roundedLat);
    setLongitude(roundedLon);

    try {
      const locationData = await reverseGeocode(roundedLat, roundedLon);
      setCity(locationData.city);
      toast.success(`Map location set: ${locationData.city}`);
    } catch (err) {
      console.error("Map reverse geocoding error:", err);
      toast.warning("Coordinates selected, couldn't resolve city.");
      setCity("Unknown");
    }
  };

  const MapClickHandler = ({
    onClick,
  }: {
    onClick: (lat: number, lon: number) => void;
  }) => {
    useMapEvents({
      click(e) {
        onClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

 return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto pt-12 pb-32"
      >
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4">Location & Solar Setup</h1>
          <p className="text-gray-400 text-lg">
            Choose your location and configure your solar panel setup
          </p>
        </div>

        <div className="space-y-6">
          {[{
            title: "Location",
            icon: <MapPin className="h-5 w-5 text-green-400" />,
            description: "Select method",
            content: (
              <>
                <Label htmlFor="city">City Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={handleCitySubmit} disabled={loading}>
                    Submit
                  </Button>
                </div>
                <div className="text-center text-gray-500">or</div>
                <Button
                  onClick={handleLiveLocation}
                  disabled={locationLoading}
                  className="w-full"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" /> Use Live Location
                    </>
                  )}
                </Button>
              </>
            )
          }, {
            title: "Map",
            description: "Click on map to select location",
            content: (
              <div className="h-[300px] rounded-xl overflow-hidden">
                <MapContainer
                  key={`${latitude || defaultLat}-${longitude || defaultLon}`}
                  center={[latitude || defaultLat, longitude || defaultLon]}
                  zoom={5}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {latitude && longitude && (
                    <Marker position={[latitude, longitude]}>
                      <Popup>{city || "Selected Location"}</Popup>
                    </Marker>
                  )}
                  <MapClickHandler onClick={handleMapClick} />
                </MapContainer>
              </div>
            )
          }, {
            title: "Solar Panel Configuration",
            icon: <Settings className="h-5 w-5 text-green-400" />,
            content: (
              <>
                <Label htmlFor="panelWattage">Peak Capacity (kWp)</Label>
                <Input
                  id="panelWattage"
                  type="number"
                  value={panelWattage}
                  onChange={(e) => setPanelWattage(e.target.value)}
                  placeholder="1.2"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </>
            )
          }].map((section, i) => (
            <motion.div
              key={i}
              className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.2 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">{section.content}</CardContent>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur border-t border-white/10 p-4 z-50">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={handleLocationSubmit}
            disabled={!latitude || !longitude || !panelWattage || loading}
            variant="solar"
            size="lg"
            className="w-full py-6 text-lg bg-white/10 backdrop-blur border border-white/20 hover:brightness-125 transition"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              "Get Solar Prediction"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Location;
