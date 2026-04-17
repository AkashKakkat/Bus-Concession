const normalizeFareDetails = (route) => {
    const baseFare = Number(route?.baseFare ?? route?.price ?? 0);
    const concessionPercent = Number(route?.concessionPercent ?? 0);
    const finalFare = Math.max(
        0,
        Number((baseFare - (baseFare * concessionPercent) / 100).toFixed(2))
    );

    return {
        baseFare,
        concessionPercent,
        finalFare
    };
};

module.exports = { normalizeFareDetails };
