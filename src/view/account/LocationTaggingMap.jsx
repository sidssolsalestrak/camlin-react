import { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Box, Typography, CircularProgress } from "@mui/material";

const LIBRARIES = ["geometry", "visualization"];
const DEFAULT_LAT = 19.076090;
const DEFAULT_LNG = 72.877426;

export function LocationTaggingMap({ initialLat, initialLng, onLocationSelect }) {
  const [markerPos, setMarkerPos] = useState(null);
  const [center, setCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: LIBRARIES,
  });

  const parsedLat = parseFloat(initialLat);
  const parsedLng = parseFloat(initialLng);

  const hasValidCoords =
    !isNaN(parsedLat) && parsedLat !== 0 &&
    !isNaN(parsedLng) && parsedLng !== 0;

  // ── KEY FIX: watch initialLat/initialLng changes
  // Dialog opens → props update from "0" to real coords → this fires
  useEffect(() => {
    if (!isLoaded) return;

    if (hasValidCoords) {
      const pos = { lat: parsedLat, lng: parsedLng };

      // update marker
      setMarkerPos(pos);

      // update center state
      setCenter(pos);

      // pan live map if already mounted
      if (mapRef.current) {
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(14);
      }

      // notify parent
      if (onLocationSelect) {
        onLocationSelect(String(parsedLat), String(parsedLng));
      }
    } else {
      // no saved coords — default location, no marker
      const defaultPos = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
      setCenter(defaultPos);
      setMarkerPos(null);

      if (mapRef.current) {
        mapRef.current.panTo(defaultPos);
      }
    }
  }, [isLoaded, initialLat, initialLng]); // ← watches both isLoaded AND prop changes

  const handleMapClick = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    const pos = { lat: newLat, lng: newLng };
    setMarkerPos(pos);
    setCenter(pos);
    if (onLocationSelect) onLocationSelect(String(newLat), String(newLng));
  };

  if (loadError) return (
    <Box sx={{ p: 2, color: "red", fontSize: "12px" }}>
      Failed to load Google Maps: {loadError.message}
    </Box>
  );

  if (!isLoaded) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={3} gap={1}>
      <CircularProgress size={20} />
      <Typography sx={{ fontSize: "12px" }}>Loading map…</Typography>
    </Box>
  );

  return (
    <Box>
      <Typography sx={{ fontSize: "12px", color: "#666", px: 2, py: 1, bgcolor: "#f5f5f5" }}>
        📍 Click anywhere on the map to tag the location
      </Typography>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "400px" }}
        center={center}
        zoom={12}
        options={{
          mapTypeId: "roadmap",
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
        onLoad={(map) => {
          mapRef.current = map;
          // ── on load, immediately pan to correct coords
          if (hasValidCoords) {
            map.panTo({ lat: parsedLat, lng: parsedLng });
            map.setZoom(14);
          }
        }}
        onClick={handleMapClick}
      >
        {markerPos && (
          <Marker
            position={markerPos}
            icon={{ url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
            title="Selected Location"
          />
        )}
      </GoogleMap>
    </Box>
  );
}