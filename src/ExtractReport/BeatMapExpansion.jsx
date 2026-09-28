import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Box, Typography, Switch, FormControlLabel, CircularProgress } from "@mui/material";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";

const LIBRARIES = [];

const MAP_STYLES = [
  {
    featureType: "administrative.province",
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "on" }, { color: "rgb(16, 97, 49)" }, { weight: 1 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.natural.landcover",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.province",
    elementType: "labels.text.fill",
    stylers: [{ color: "#000000" }, { visibility: "on" }, { weight: 2 }],
  },
];

// For BeatMapExpansion — tip of pin anchors to coordinate (precise street-level)
const createPinMarker = () => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#4CAF50",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2,
  scale: 1.5,
  anchor: new window.google.maps.Point(12, 24),
});

// For AllLocationsMap — center of icon aligns with heatmap dot
const createCenteredMarker = () => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#4CAF50",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2,
  scale: 1.1,
  anchor: new window.google.maps.Point(13, 21),
});

// ── Single beat location map (inline row expansion) ───────────────────────────
export function BeatMapExpansion({ row }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [markerIcon, setMarkerIcon] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: LIBRARIES,
  });

  const lat = parseFloat(row.latitude);
  const lng = parseFloat(row.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  useEffect(() => {
    if (isLoaded && window.google) {
      setMarkerIcon(createPinMarker());
    }
  }, [isLoaded]);

  useEffect(() => {
    if (mapInstance && window.google) {
      window.google.maps.event.trigger(mapInstance, "resize");
      mapInstance.setCenter({ lat, lng });
    }
  }, [mapInstance, lat, lng]);

  if (loadError) return (
    <Box sx={{ p: 2, color: "red", fontSize: "12px" }}>
      Failed to load Google Maps. Error: {loadError.message}
    </Box>
  );

  if (!isLoaded) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2}>
      <CircularProgress size={20} />
      <Typography sx={{ ml: 1, fontSize: "12px" }}>Loading map...</Typography>
    </Box>
  );

  if (!hasCoords) return (
    <Box sx={{ p: 2, color: "#888", fontSize: "12px", textAlign: "center" }}>
      No location data available for <strong>{row.beat_work}</strong>
    </Box>
  );

  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden", mx: 1, my: 0.5 }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "300px" }}
        center={{ lat, lng }}
        zoom={20}
        options={{
          mapTypeId: "roadmap",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
        onLoad={(map) => setMapInstance(map)}
      >
        {markerIcon && (
          <Marker
            position={{ lat, lng }}
            title={row.beat_work}
            icon={markerIcon}
            onMouseOver={() => setInfoOpen(true)}
            onMouseOut={() => setInfoOpen(false)}
          />
        )}
        {infoOpen && (
          <InfoWindow
            position={{ lat, lng }}
            onCloseClick={() => setInfoOpen(false)}
            options={{ disableAutoPan: true }}
          >
            <div style={{ fontSize: "12px", padding: "2px 4px" }}>
              <strong>{row.location_name ?? row.beat_work ?? "Location"}</strong>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
}


// ── All Locations modal map (View all Location button) ────────────────────────
export function AllLocationsMap({ coordinates = [], open, onClose }) {
  const [showMarkers, setShowMarkers] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [activeInfo, setActiveInfo] = useState(null);
  const [markerIcon, setMarkerIcon] = useState(null);
  const deckOverlayRef = useRef(null); // ← deck.gl overlay ref

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: LIBRARIES,
  });

  const validCoords = coordinates.filter(coord => {
    const lat = parseFloat(coord.latitude);
    const lng = parseFloat(coord.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

  // Build deck.gl heatmap data points
  const heatmapData = validCoords.map(coord => ({
    position: [parseFloat(coord.longitude), parseFloat(coord.latitude)],
    weight: 1,
  }));

  const handleMapLoad = (map) => {
    setMapInstance(map);
    if (!window.google) return;

    setMarkerIcon(createCenteredMarker());

    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(8.1, 68.7),
      new window.google.maps.LatLng(37.1, 97.4),
    );
    map.fitBounds(bounds);
    setTimeout(() => map.setZoom(4.7), 500);

    // ✅ deck.gl GoogleMapsOverlay with HeatmapLayer
    const overlay = new GoogleMapsOverlay({
      layers: [
        new HeatmapLayer({
          id: "heatmap-layer",
          data: heatmapData,
          getPosition: d => d.position,
          getWeight: d => d.weight,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.03,
          colorRange: [
            [0, 0, 255, 0],       // transparent blue (low)
            [0, 255, 255, 128],   // cyan
            [0, 255, 0, 180],     // green
            [255, 255, 0, 200],   // yellow
            [255, 128, 0, 220],   // orange
            [255, 0, 0, 255],     // red (high)
          ],
        }),
      ],
    });
    overlay.setMap(map);
    deckOverlayRef.current = overlay;

    // Load India state boundaries
    map.data.loadGeoJson('/json/states_india.geojson', {}, () => {
      map.data.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        strokeColor: '#00AF00',
        strokeWeight: 2,
        strokeOpacity: 1,
      });
    });

    window.google.maps.event.trigger(map, "resize");
  };

  // Cleanup on modal close
  useEffect(() => {
    if (!open) {
      if (deckOverlayRef.current) {
        deckOverlayRef.current.setMap(null); // ← detach deck overlay
        deckOverlayRef.current = null;
      }
      setShowMarkers(false);
      setMapInstance(null);
      setActiveInfo(null);
      setMarkerIcon(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <Box sx={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1300, display: "flex", flexDirection: "column",
      backgroundColor: "#fff",
    }}>
      {/* Header */}
      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 2, py: 1,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        minHeight: 48,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
            Map
          </Typography>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showMarkers}
                onChange={(e) => setShowMarkers(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#2196F3" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#2196F3" },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "13px" }}>
                {showMarkers ? "Heat Map and Location" : "Heat Map"}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        <Typography
          onClick={onClose}
          sx={{
            fontSize: "20px", cursor: "pointer", color: "#666",
            lineHeight: 1, px: 1,
            "&:hover": { color: "#000" },
          }}
        >
          ×
        </Typography>
      </Box>

      {/* Map body */}
      <Box sx={{ flex: 1, position: "relative" }}>
        {loadError && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography color="error">Failed to load Google Maps.</Typography>
          </Box>
        )}

        {!isLoaded && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={32} />
          </Box>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            zoom={5.5}
            center={{ lat: 20.5937, lng: 78.9629 }}
            options={{
              mapTypeId: "roadmap",
              styles: MAP_STYLES,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
            }}
            onLoad={handleMapLoad}
          >
            {/* Render markers only when toggle is ON and icon is ready */}
            {showMarkers && markerIcon && validCoords.map((coord, i) => {
              const lat = parseFloat(coord.latitude);
              const lng = parseFloat(coord.longitude);
              return (
                <Marker
                  key={i}
                  position={{ lat, lng }}
                  title={coord.location_name ?? ""}
                  icon={markerIcon}
                  onMouseOver={() => setActiveInfo({ lat, lng, addr: coord.location_name })}
                  onMouseOut={() => setActiveInfo(null)}
                />
              );
            })}

            {activeInfo && (
              <InfoWindow
                position={{ lat: activeInfo.lat, lng: activeInfo.lng }}
                onCloseClick={() => setActiveInfo(null)}
                options={{ disableAutoPan: true }}
              >
                <div style={{ fontSize: "12px", padding: "2px 4px" }}>
                  <strong>{activeInfo.addr ?? "Location"}</strong>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </Box>
    </Box>
  );
}