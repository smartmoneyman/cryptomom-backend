const SNAPSHOTS = {};

export function saveSnapshot(symbol, snapshot) {
  if (!SNAPSHOTS[symbol]) SNAPSHOTS[symbol] = [];
  SNAPSHOTS[symbol].push(snapshot);

  // храним последние 48 часов
  SNAPSHOTS[symbol] = SNAPSHOTS[symbol].slice(-48);
}

export function getSnapshots(symbol) {
  return SNAPSHOTS[symbol] || [];
}
