import { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Box, Typography, CircularProgress, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { GOOGLE_MAPS_LIBRARIES } from "../../utils/googleMapsConfig";

const DEFAULT_LAT = 19.076090;
const DEFAULT_LNG = 72.877426;

export function LocationTaggingMap({ initialLat, initialLng, onLocationSelect }) {
  const [markerPos, setMarkerPos] = useState(null);
  const [center, setCenter] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [searchValue, setSearchValue] = useState("");
  const mapRef = useRef(null);
  const inputRef = useRef(null);          // ← ref to the actual <input> DOM node
  const autocompleteRef = useRef(null);   // ← holds the google.maps.places.Autocomplete instance

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
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

      setMarkerPos(pos);
      setCenter(pos);

      if (mapRef.current) {
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(14);
      }

      if (onLocationSelect) {
        onLocationSelect(String(parsedLat), String(parsedLng));
      }
    } else {
      const defaultPos = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
      setCenter(defaultPos);
      setMarkerPos(null);

      if (mapRef.current) {
        mapRef.current.panTo(defaultPos);
      }
    }
  }, [isLoaded, initialLat, initialLng]);

  // ── Manually initialize Places Autocomplete on the real input node ──
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    // Avoid double-initializing if this effect re-runs
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "name"],
      // componentRestrictions: { country: "in" }, // optional: bias to a country
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        // no valid place picked (e.g. user hit Enter without selecting a suggestion)
        return;
      }

      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      const pos = { lat: newLat, lng: newLng };

      setMarkerPos(pos);
      setCenter(pos);
      setSearchValue(place.formatted_address || place.name || "");

      if (mapRef.current) {
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(16);
      }

      if (onLocationSelect) {
        onLocationSelect(String(newLat), String(newLng));
      }
    });

    // cleanup on unmount
    return () => {
      window.google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [isLoaded]);

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
      {/* ── Inline fix: Google's .pac-container renders in document.body and can
          get hidden behind MUI Dialog's backdrop/paper (z-index ~1300) ── */}
      <style>{`
        .pac-container {
          z-index: 1400 !important;
        }
      `}</style>

      {/* ── Address Search Box ── */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #eee" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for an address to tag..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          inputRef={inputRef}   // ← forwards to the native <input>
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#888" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Typography sx={{ fontSize: "12px", color: "#666", px: 2, py: 1, bgcolor: "#f5f5f5" }}>
        📍 Search an address above, or click anywhere on the map to tag the location
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