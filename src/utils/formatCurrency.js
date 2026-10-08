const FormatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "0";

    if (Number.isInteger(num)) {
        return num.toLocaleString("en-IN");
    }

    return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default FormatCurrency;