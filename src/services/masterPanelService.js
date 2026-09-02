import axios from "./api";

let masterPanelCache = null; // in-memory cache for the current tab/session
let fetchPromise = null; // prevents duplicate parallel calls

const CACHE_KEY = "masterPanelCache";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes — tune based on how often data changes

// Read cached data from localStorage if it exists and hasn't expired
const getFromStorage = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error reading master panel from storage:", err);
    return null;
  }
};

// Save fetched data to localStorage with a timestamp
const saveToStorage = (data) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (err) {
    console.error("Error saving master panel to storage:", err);
  }
};

// Fetch and build { tag_id: client_alias } map, like PHP's $master_panel
const fetchMasterPanel = async () => {
  try {
    const res = await axios.post("/getMasterPanel", {});
    if (res.data.status === 200 && Array.isArray(res.data.data)) {
      const map = {};
      res.data.data.forEach((item) => {
        map[item.tag_id] = item.client_alias;
      });
      saveToStorage(map);
      return map;
    }
    return {};
  } catch (err) {
    console.error("Error fetching master panel:", err);
    return {};
  }
};

// Public function - equivalent to PHP's get_master_panel()
export const getMasterPanel = async () => {
  // 1. In-memory cache (fastest, valid for this tab's lifetime)
  if (masterPanelCache) {
    return masterPanelCache;
  }

  // 2. A fetch is already in progress — wait for it instead of firing another
  if (fetchPromise) {
    return fetchPromise;
  }

  // 3. Check localStorage (survives page reloads, subject to TTL)
  const stored = getFromStorage();
  if (stored) {
    masterPanelCache = stored;
    return stored;
  }

  // 4. Nothing cached anywhere — hit the API once
  fetchPromise = fetchMasterPanel().then((map) => {
    masterPanelCache = map;
    fetchPromise = null;
    return map;
  });

  return fetchPromise;
};

// Clears both memory and localStorage — call this after backend data changes
export const clearMasterPanelCache = () => {
  masterPanelCache = null;
  fetchPromise = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.error("Error clearing master panel storage:", err);
  }
};