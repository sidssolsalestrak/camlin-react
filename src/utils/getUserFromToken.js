export const getUserFromToken = () => {
  const token = localStorage.getItem("session-token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (err) {
    console.log("Invalid token", err);
    return null;
  }
};
