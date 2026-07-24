import axios from "./api";

let cusFormCache = {};
let fetchPromiseMap = {};

const fetchCusFormMas = async (customerAccType) => {
  try {
    const res = await axios.post("/getCusFormMas", { customerAccType });
    if (res.data.status === 200 && Array.isArray(res.data.data)) {
      const map = {};
      res.data.data.forEach((item) => {
        map[item.label_name] = {
          alias_label_name: item.alias_label_name,
          label_stat: item.label_stat,
        };
      });
      return map;
    }
    return {};
  } catch (err) {
    console.error("Error fetching cus form mas:", err);
    return {};
  }
};

export const getCusFormMas = async (customerAccType) => {
  if (cusFormCache[customerAccType]) {
    return cusFormCache[customerAccType];
  }
  if (fetchPromiseMap[customerAccType]) {
    return fetchPromiseMap[customerAccType];
  }

  fetchPromiseMap[customerAccType] = fetchCusFormMas(customerAccType).then((map) => {
    cusFormCache[customerAccType] = map;
    delete fetchPromiseMap[customerAccType];
    return map;
  });

  return fetchPromiseMap[customerAccType];
};

export const clearCusFormMasCache = (customerAccType) => {
  if (customerAccType) {
    delete cusFormCache[customerAccType];
  } else {
    cusFormCache = {};
  }
};