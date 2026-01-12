import axios from "axios";

const BASE = "https://fapi.binance.com";

export async function fetchPerpetualSymbols() {
  const { data } = await axios.get(`${BASE}/fapi/v1/exchangeInfo`);
  return data.symbols
    .filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT")
    .map(s => s.symbol);
}

export async function fetchVolume24h(symbol) {
  const { data } = await axios.get(`${BASE}/fapi/v1/ticker/24hr`, {
    params: { symbol }
  });
  return Number(data.quoteVolume);
}

export async function fetchFunding(symbol) {
  try {
    const { data } = await axios.get(`${BASE}/fapi/v1/premiumIndex`, {
      params: { symbol }
    });
    return Number(data.lastFundingRate);
  } catch {
    return null;
  }
}

export async function fetchOpenInterest(symbol) {
  try {
    const { data } = await axios.get(`${BASE}/fapi/v1/openInterest`, {
      params: { symbol }
    });
    return Number(data.openInterest);
  } catch {
    return null;
  }
}

