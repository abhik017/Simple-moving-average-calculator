const yahooFinance = require('yahoo-finance');
const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const smaCalculator = require('./sma-calculator');
const csvWriter1 = createCsvWriter({
  path: '../200sma.csv',
  header: [
    {id: 'sma200', title: '200 SMA'}
  ]
});
const csvWriter2 = createCsvWriter({
  path: '../100sma.csv',
  header: [
    {id: 'sma100', title: '100 SMA'}
  ]
});
const csvWriter3 = createCsvWriter({
  path: '../50sma.csv',
  header: [
    {id: 'sma50', title: '50 SMA'}
  ]
});
const tickerArray = [];
let counter = 0;

const tickerData = new Promise((resolve) => {
  fs.createReadStream(path.join(__dirname, "../ind_nifty500list.csv"))
  .pipe(
    parse({
      delimiter: ','
    })
  )
  .on('data', (dataRow) => {
    if(counter != 0) {
      tickerArray.push(dataRow[2]);
    }
    counter++;
  })
  .on('end', () => {
    resolve(tickerArray);
  });
});

function getToDate() {
  const today = new Date();
  let month = today.getMonth() + 1;
  if(month < 10) {
    month = '0' + month;
  }
  return today.getFullYear() + '-' + month + '-' + today.getDate();
}

function getFromDate() {
  const today = new Date();
  let month = today.getMonth() + 1;
  if(month < 10) {
    month = '0' + month;
  }
  return (today.getFullYear()-1) + '-' + month + '-' + today.getDate();
}

async function getOhlcData(stock, from, to) {
  const ohlcData = new Promise((resolve, reject) => {
    yahooFinance.historical({
      symbol: stock,
      from: from,
      to: to,
    }, (err, quotes) => {
      if(err) {
        reject(err);
      }
      resolve(quotes);
    });
  });
  return ohlcData;
}

async function calcSma() {
  const tickerList = await tickerData;
  const fifty = [], hundred = [], twoHundred = [];
  // tickerList.forEach( async(element, index) => {}
  for(let index = 0; index < tickerList.length; index++) {
    try {
      const element = tickerList[index];
      const ohlcData = await getOhlcData(element + '.NS', getFromDate(), getToDate());
      let latestClosePrice = ohlcData[0].close, i = 0;
      while(latestClosePrice === null && i < 200) {
        i++;
        latestClosePrice = ohlcData[i].close;
      }
      const fiftySma = smaCalculator(ohlcData, 50), hundredSma = smaCalculator(ohlcData, 100),
        twoHundredSma = smaCalculator(ohlcData, 200);
      if(fiftySma + 0.01 * fiftySma >= latestClosePrice && fiftySma - 0.01 * fiftySma <= latestClosePrice) {
        fifty.push({
          sma50: element
        });
      }
      if(hundredSma + 0.01 * hundredSma >= latestClosePrice && hundredSma - 0.01 * hundredSma <= latestClosePrice) {
        hundred.push({
          sma100: element
        });
      }
      if(twoHundredSma + 0.01 * twoHundredSma >= latestClosePrice && twoHundredSma - 0.01 * twoHundredSma <= latestClosePrice) {
        twoHundred.push({
          sma200: element
        });
      }
      // console.log(`${fiftySma}, ${hundredSma}, ${twoHundredSma}`);
      if(!(index % 10)) {
        console.log(`50SMA: ${JSON.stringify(fifty)}, 100SMA: ${JSON.stringify(hundred)}, 200SMA: ${JSON.stringify(twoHundred)} fetched ${index + 1} records`);
      }
    } catch(err) {
      console.log(err);
    }
  }
  return {
    sma200: twoHundred,
    sma100: hundred,
    sma50: fifty
  }
}


async function generateCsv() {
  const result = await calcSma();
  csvWriter1
    .writeRecords(result.sma200)
    .then(() => {
      console.log("200 SMA CSV generated!");
    })
    .catch((err) => {
      console.log(err);
    });
  csvWriter2
    .writeRecords(result.sma100)
    .then(() => {
      console.log("100 SMA CSV generated!");
    })
    .catch((err) => {
      console.log(err);
    });
  csvWriter3
    .writeRecords(result.sma50)
    .then(() => {
      console.log("50 SMA CSV generated!");
    })
    .catch((err) => {
      console.log(err);
    });
}

generateCsv();