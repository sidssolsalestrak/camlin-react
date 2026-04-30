const FormatCurrency = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}
export default FormatCurrency;