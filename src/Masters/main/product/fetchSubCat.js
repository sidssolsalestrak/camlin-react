import axios from "../../../services/api";

const fetchSubCat = async (setSubCat) => {
    try {
        const res = await axios.post("/getSubCat");
        setSubCat(Array.isArray(res?.data?.data) ? res?.data?.data : [])
    } catch (error) {
        console.error("sub data fetch error", error);
        setSubCat([])
    }
}

export default fetchSubCat;