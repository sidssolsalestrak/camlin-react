import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Box, Typography, Switch, FormControlLabel, CircularProgress } from "@mui/material";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import api from "../services/api";

const LIBRARIES = [];

const MAP_STYLES = [
    {
        featureType: "administrative.province",
        elementType: "labels.text.stroke",
        stylers: [{ visibility: "on" }, { color: "#000000" }, { weight: 1 }],
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

const createCustomGreenMarker = () => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#4CAF50",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 1.1,
    anchor: new window.google.maps.Point(13, 21),
});

export function OutletCountMap({ open, onClose, selZone, selRegion, selArea, selUser, userType, userId }) {
    const [showMarkers, setShowMarkers] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [activeInfo, setActiveInfo] = useState(null);
    const [markerIcon, setMarkerIcon] = useState(null);
    const [validCoords, setValidCoords] = useState([]);
    const deckOverlayRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_API_KEY,
        libraries: LIBRARIES,
    });

    // Set marker icon once Maps API is loaded
    useEffect(() => {
        if (isLoaded && window.google) {
            setMarkerIcon(createCustomGreenMarker());
        }
    }, [isLoaded]);

    // Fetch coords when dialog opens
    useEffect(() => {
        if (!open) return;
        fetchAndFilter();
    }, [open]);

    const fetchAndFilter = async () => {
        try {
            const res = await api.get('/get_loc_map');
            const data = await res.data.data;
            console.log("outlet count map Data", data[0]);

            let filtered = data[0].filter(item => {
                if (Number(userType) === 8) return String(item.user_id) === String(userId);
                if (Number(userType) === 15) return String(item.am_id) === String(userId);
                if (Number(userType) === 14) return String(item.zbm_id) === String(userId);
                if (Number(userType) === 13) return String(item.rsm_id) === String(userId);
                if (Number(userType) === 16) return String(item.sh_id) === String(userId);
                if (Number(userType) < 5) return true;
                return false;
            });

            if (selUser > 0) filtered = filtered.filter(i => String(i.user_id) === String(selUser));
            else if (selArea > 0) filtered = filtered.filter(i => String(i.area_id) === String(selArea));
            else if (selRegion > 0) filtered = filtered.filter(i => String(i.reg_id) === String(selRegion));
            else if (selZone > 0) filtered = filtered.filter(i => String(i.zone_id) === String(selZone));

            const coords = filtered.filter(item => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            });

            setValidCoords(coords);
        } catch (err) {
            console.log("cus_loc fetch error", err);
        }
    };

    // Build / rebuild deck.gl overlay whenever mapInstance or validCoords change
    useEffect(() => {
        if (!mapInstance || validCoords.length === 0) return;

        // Tear down previous overlay
        if (deckOverlayRef.current) {
            deckOverlayRef.current.setMap(null);
            deckOverlayRef.current = null;
        }

        const heatmapData = validCoords.map(coord => ({
            position: [parseFloat(coord.longitude), parseFloat(coord.latitude)],
            weight: 1,
        }));

        const overlay = new GoogleMapsOverlay({
            layers: [
                new HeatmapLayer({
                    id: "heatmap-layer",
                    data: heatmapData,
                    getPosition: d => d.position,
                    getWeight: d => d.weight,
                    radiusPixels: 40,       // ✅ already set
                    intensity: 6,
                    threshold: 0.03,
                    colorRange: [
                        [0, 255, 0, 180],    // green  (low)
                        [255, 255, 0, 210],  // yellow (mid)
                        [255, 0, 0, 180],    // red    (high)
                    ],
                }),
            ],
        });

        overlay.setMap(mapInstance);
        deckOverlayRef.current = overlay;
    }, [mapInstance, validCoords]);

    // Cleanup everything when dialog closes
    useEffect(() => {
        if (!open) {
            if (deckOverlayRef.current) {
                deckOverlayRef.current.setMap(null);
                deckOverlayRef.current = null;
            }

            setShowMarkers(false);
            setMapInstance(null);
            setActiveInfo(null);
            setValidCoords([]);
        }
    }, [open]);

    const handleMapLoad = (map) => {
        setMapInstance(map);
        if (!window.google) return;

        const bounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(8.1, 68.7),
            new window.google.maps.LatLng(37.1, 97.4),
        );
        map.fitBounds(bounds);
        setTimeout(() => map.setZoom(4.7), 500);

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
                    <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>Map</Typography>
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
                        lineHeight: 1, px: 1, "&:hover": { color: "#000" },
                    }}
                >
                    ×
                </Typography>
            </Box>

            {/* Map Area */}
            <Box sx={{ flex: 1, position: "relative" }}>
                {loadError && (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="error">Failed to load Google Maps.</Typography>
                    </Box>
                )}
                {!isLoaded && !loadError && (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress size={32} />
                    </Box>
                )}
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        zoom={4.7}
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
                        {showMarkers && markerIcon && validCoords.map((coord, i) => {
                            const lat = parseFloat(coord.latitude);
                            const lng = parseFloat(coord.longitude);
                            return (
                                <Marker
                                    key={i}
                                    position={{ lat, lng }}
                                    title={coord.loc_addr ?? ""}
                                    icon={markerIcon}
                                    onMouseOver={() => setActiveInfo({ lat, lng, addr: coord.loc_addr })}
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