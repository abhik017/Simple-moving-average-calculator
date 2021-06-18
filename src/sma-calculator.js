const smaCalculator = (ohlcData, length) => {
    let totSum = 0, counter = 0;
    for(let i = 0; i < length; i++) {
        if(ohlcData[i].close === null) {
            continue;
        }
        totSum += ohlcData[i].close;
        counter++;
    }
    return (totSum/counter);
};

module.exports = smaCalculator;