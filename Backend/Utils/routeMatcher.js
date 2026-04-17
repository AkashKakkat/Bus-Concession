const normalizeRouteText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const isSameRoutePoint = (left, right) =>
    normalizeRouteText(left) === normalizeRouteText(right);

module.exports = {
    normalizeRouteText,
    isSameRoutePoint
};
