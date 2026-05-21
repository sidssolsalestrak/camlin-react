import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Box, Typography, CircularProgress } from "@mui/material";

const LIBRARIES = ["geometry", "visualization"];

const DEFAULT_LAT = 19.076090;   // exact same as PHP hidden input
const DEFAULT_LNG = 72.877426;

export function LocationTaggingMap({ initialLat, initialLng, onLocationSelect }) {
  const [markerPos, setMarkerPos] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: LIBRARIES,
  });

  // PHP: var lat = $('#latitude').val(); if(lat==0){ lat=19.076090; long=72.877426; }
  const lat = parseFloat(initialLat) || DEFAULT_LAT;
  const lng = parseFloat(initialLng) || DEFAULT_LNG;

  // PHP: places a green marker at the existing lat/lng on map load
  useEffect(() => {
    if (isLoaded) {
      setMarkerPos({ lat, lng });
    }
  }, [isLoaded]);

  useEffect(() => {
    if (mapInstance) {
      window.google.maps.event.trigger(mapInstance, "resize");
      mapInstance.setCenter({ lat, lng });
    }
  }, [mapInstance]);

  // PHP: map.addListener('click', function(event) { marker.setPosition(event.latLng); ... })
  const handleMapClick = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPos({ lat: newLat, lng: newLng });   // moves marker to clicked point
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
        center={{ lat, lng }}
        zoom={12}
        options={{
          mapTypeId: "roadmap",
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
        onLoad={(map) => setMapInstance(map)}
        onClick={handleMapClick}
      >
        {/* PHP: green marker at current/default position */}
        {markerPos && (
          <Marker
            position={markerPos}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
            title="Selected Location"
          />
        )}
      </GoogleMap>
    </Box>
  );
}