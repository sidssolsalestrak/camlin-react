// Encode
export const encode = (value) => {
  try {
    return value ? btoa(value) : null;
  } catch (e) {
    return value;
  }
};

// Decode
export const decode = (value) => {
  try {
    return value ? atob(value) : null;
  } catch (e) {
    return value;
  }
};
