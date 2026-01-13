import {
  fetchPerpetualSymbols,
  fetchVolume24h,
  fetchFunding,
  fetchOpenInterest
} from "../fetch/binance.js";

import { saveSnapshot, getSnapshots } from "../storage/snapshots.js";
import { saveMomentum } from "../storage/momentum.js";
import { calculateMomentum } from "../engine/momentum.js";
import { classify } from "../engine/classify.js";
import { runtimeState } from "../runtime/state.js";
import { sendPushNotification } from '../push/notifier.js';
import { getSubscriptions } from "../storage/subscriptions.js";

const MIN_VOLUME_24H = 10_000_000;

// ===== RATE LIMITING =====
// Sleep function to avoid Binance rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Binance rate limit: 1200 requests/minute = 20 requests/second
// We do 3 requests per symbol, so max ~6-7 symbols per second
// Add 150ms delay between symbols = ~6.6 symbols/sec = ~20 requests/sec
const DELAY_BETWEEN_SYMBOLS = 1500; // milliseconds

export async function runHourly() {
  runtimeState.runs++;

  if (runtimeState.runs >= 2 && runtimeState.mode === "bootstrap") {
    runtimeState.mode = "normal";
    console.log("🔁 Switching to NORMAL hourly mode");
  }

  console.log("📡 Fetching futures from Binance...");
  const symbols = await fetchPerpetualSymbols();
  console.log(`✅ Fetched ${symbols.length} futures symbols`);
  
  const dataset = [];

  const hourTimestamp = Math.floor(Date.now() / 3_600_000) * 3_600_000;

  let processed = 0;
  let skipped = 0;

  console.log("🔄 Processing symbols (with rate limiting)...");
  
  for (const symbol of symbols) {
    try {
      const [volume24h, funding, oi] = await Promise.all([
        fetchVolume24h(symbol),
        fetchFunding(symbol),
        fetchOpenInterest(symbol)
      ]);

      if (volume24h === null || volume24h < MIN_VOLUME_24H) {
        skipped++;
        continue;
      }

      if (funding === null || oi === null) {
        skipped++;
        continue;
      }

      const snapshot = {
        timestamp: hourTimestamp,
        volume24h,
        funding,
        oi
      };

      saveSnapshot(symbol, snapshot);

      const history = getSnapshots(symbol);
      if (history.length < 2) {
        skipped++;
        continue;
      }

      const prev = history.at(-2);

      if (prev.volume24h <= 0 || prev.oi <= 0) {
        skipped++;
        continue;
      }

      dataset.push({
        symbol,
        score: undefined, // заполнится позже
        volumeAccel:
          (snapshot.volume24h - prev.volume24h) / prev.volume24h,
        oiDelta:
          (snapshot.oi - prev.oi) / prev.oi,
        fundingDelta:
          snapshot.funding - prev.funding
      });

      processed++;

      // ===== RATE LIMITING: Add delay between symbols =====
      await sleep(DELAY_BETWEEN_SYMBOLS);

    } catch (err) {
      skipped++;
      
      // Log different types of errors differently
      if (err.response && err.response.status === 429) {
        console.warn(`⚠️ ${symbol} skipped: Rate limit hit (429), increasing delay...`);
        // If we hit rate limit, wait longer
        await sleep(1000);
      } else {
        console.warn(`⚠️ ${symbol} skipped: ${err.message}`);
      }
    }
  }

  if (dataset.length === 0) {
    console.warn("⚠️ No momentum data calculated this run");
    console.warn(`Processed: ${processed}, Skipped: ${skipped}`);
    return;
  }

  console.log("📊 Calculating momentum scores...");
  
  const ranked = calculateMomentum(dataset)
  .map((m, index) => ({
    symbol: m.symbol,
    score: m.score,
    state: classify(m.score),
    rank: index + 1,
    
    // пробрасываем breakdown
    volumeAccel: m.volumeAccel,
    oiDelta: m.oiDelta,
    fundingDelta: m.fundingDelta
  }))
  .sort((a, b) => b.score - a.score);

  // ⚠️ ВАЖНО: После сортировки нужно пересчитать rank!
  ranked.forEach((coin, index) => {
    coin.rank = index + 1;
  });

  saveMomentum(ranked);
  
  // ===== SEND PUSH NOTIFICATIONS =====
  const hotCoins = ranked.filter(c => c.state === 'accelerating').slice(0, 5);
  const subscriptions = getSubscriptions();

  if (hotCoins.length > 0 && subscriptions.length > 0) {
    console.log(`🔔 Sending push to ${subscriptions.length} subscribers about ${hotCoins.length} hot coins`);
    
    // Отправь всем подписчикам
    for (const subscription of subscriptions) {
      try {
        await sendPushNotification(subscription, {
          title: '🔥 Hot Coins Alert!',
          body: `${hotCoins[0].symbol} is accelerating (${(hotCoins[0].score * 100).toFixed(0)}%)`,
          tag: 'hot-coins',
          data: {
            coins: hotCoins.map(c => c.symbol)
          }
        });
      } catch (error) {
        console.warn('⚠️ Failed to send push to subscriber:', error.message);
      }
    }
  } else if (hotCoins.length > 0) {
    console.log(`🔥 ${hotCoins.length} hot coins detected, but no subscribers yet`);
  }

  console.log(
    `✅ Momentum calculated | Processed: ${processed}, Skipped: ${skipped}`
  );

  console.table(ranked.slice(0, 10));
}
