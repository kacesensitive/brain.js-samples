const fs = require("fs");
const brain = require("brain.js");

const data = JSON.parse(fs.readFileSync("./stocks.json"));

const normalize = (data, lowestValue, highestValue) => {
  return {
    open: (data.Open - lowestValue) / (highestValue - lowestValue),
    high: (data.High - lowestValue) / (highestValue - lowestValue),
    low: (data.Low - lowestValue) / (highestValue - lowestValue),
    close: (data.Close - lowestValue) / (highestValue - lowestValue),
  };
};

const denormalize = (data, lowestValue, highestValue) => {
  return {
    open: data.open * (highestValue - lowestValue) + lowestValue,
    high: data.high * (highestValue - lowestValue) + lowestValue,
    low: data.low * (highestValue - lowestValue) + lowestValue,
    close: data.close * (highestValue - lowestValue) + lowestValue,
  };
};

const getHighestValueInData = (data) => {
  const max = (data, key) => {
    const maxValue = data.reduce((prev, current) =>
      prev[`${key}`] > current[`${key}`] ? prev : current
    );
    return Number(maxValue[`${key}`]);
  };

  const maxOpen = max(data, "Open");
  const maxHigh = max(data, "High");
  const maxLow = max(data, "Low");
  const maxClose = max(data, "Close");

  return Math.max(...[maxOpen, maxHigh, maxLow, maxClose]);
};

const getLowestValueInData = (data) => {
  const low = (data, key) => {
    const lowValue = data.reduce((prev, current) =>
      prev[`${key}`] < current[`${key}`] ? prev : current
    );
    return Number(lowValue[`${key}`]);
  };

  const lowOpen = low(data, "Open");
  const lowHigh = low(data, "High");
  const lowLow = low(data, "Low");
  const lowClose = low(data, "Close");

  return Math.min(...[lowOpen, lowHigh, lowLow, lowClose]);
};

const main = async () => {
  const stockData = data;

  const normalizHighestValue = getHighestValueInData(stockData);
  const normalizLowestValue = getLowestValueInData(stockData);

  // normalize
  const normalisedStockData = stockData.map((item) =>
    normalize(item, normalizHighestValue, normalizLowestValue)
  );

  // TRAINING DATA SPLIT INTO A 2D ARRAY WITH 5 ITEMS
  const generateTrainingData = (data, setSize) => {
    var newData = [];

    for (let i = 0; i < data.length; i += setSize) {
      newData.push(data.slice(i, i + setSize));
    }

    return newData;
  };

  const trainingData = generateTrainingData(normalisedStockData, 5);

  // SET UP NEURAL NETWORK
  const neuralNetwork = new brain.recurrent.LSTMTimeStep({
    inputSize: 4,
    hiddenLayers: [8, 8],
    outputSize: 4,
  });

  console.log(trainingData);

  neuralNetwork.train(trainingData, {
    learningRate: 0.005,
    errorThresh: 0.002,
    log: (stats) => console.log(stats),
  });

  const result = neuralNetwork.forecast(
    [
      trainingData[9][0],
      trainingData[9][1],
      trainingData[9][2],
      trainingData[9][3],
      trainingData[9][4],
    ],
    5
  );

  const denormaliseResult = result.map((item) =>
    denormalize(item, normaliseLowValue, normaliseHighValue)
  );

  console.log(denormaliseResult);

  if (
    denormaliseResult[denormaliseResult.length - 1]["high"] >
    stockData[stockData.length - 1]["High"]
  ) {
    console.log("BUY");
  } else {
    console.log("UNSURE MIGHT BE SHORT STOCK");
  }
};

main();
