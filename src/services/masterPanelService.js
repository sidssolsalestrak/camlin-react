import axios from "./api";

let masterPanelCache = null; // cache so we don't hit API every time
let fetchPromise = null; // prevents duplicate parallel calls

// Fetch and build { tag_id: client_alias } map, like PHP's $master_panel
const fetchMasterPanel = async () => {
  try {
    const res = await axios.post("/getMasterPanel", {});
    if (res.data.status === 200 && Array.isArray(res.data.data)) {
      const map = {};
      res.data.data.forEach((item) => {
        map[item.tag_id] = item.client_alias;
      });
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
  if (masterPanelCache) {
    return masterPanelCache; // already fetched, return cached map
  }
  if (fetchPromise) {
    return fetchPromise; // fetch already in progress, wait for it
  }

  fetchPromise = fetchMasterPanel().then((map) => {
    masterPanelCache = map;
    fetchPromise = null;
    return map;
  });

  return fetchPromise;
};

// Optional - force refresh if data changes on backend
export const clearMasterPanelCache = () => {
  masterPanelCache = null;
};