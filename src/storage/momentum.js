const MOMENTUM_STATE = {
  updatedAt: null,
  data: [] // [{ symbol, score, state }]
};

export function saveMomentum(results) {
  MOMENTUM_STATE.updatedAt = Date.now();
  MOMENTUM_STATE.data = results;
}

export function getMomentum() {
  return MOMENTUM_STATE;
}

export function getSymbol(symbol) {
  return MOMENTUM_STATE.data.find(
    s => s.symbol.toUpperCase() === symbol.toUpperCase()
  );
}
