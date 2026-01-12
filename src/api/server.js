import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { getMomentum, getSymbol } from "../storage/momentum.js";
import { saveSubscription } from "../storage/subscriptions.js";

const app = express();

// ===== ESM-safe __dirname =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MIDDLEWARE =====
app.use(express.json());

// ===== CORS - CRITICAL FOR MOBILE APPS =====
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ===== SERVE MOBILE CLIENT =====
// папка mobile лежит в корне проекта
const mobilePath = path.resolve(__dirname, "../../mobile");
app.use(express.static(mobilePath));

// ===== API ROUTES =====

/**
 * GET /momentum/top
 */
app.get("/momentum/top", (req, res) => {
  const { limit = 20 } = req.query;
  const state = getMomentum();

  res.json({
    updatedAt: state.updatedAt,
    timeframe: "1h",
    data: state.data.slice(0, Number(limit))
  });
});

/**
 * GET /momentum/:symbol
 */
app.get("/momentum/:symbol", (req, res) => {
  const { symbol } = req.params;
  const coin = getSymbol(symbol);

  if (!coin) {
    return res.status(404).json({
      error: "Symbol not found or not active"
    });
  }

  res.json({
    timeframe: "1h",
    ...coin
  });
});

/**
 * GET /trends
 */
app.get("/trends", (req, res) => {
  const { data } = getMomentum();

  const buckets = {
    accelerating: [],
    building: [],
    stable: [],
    cooling: [],
    fading: []
  };

  for (const c of data) {
    if (buckets[c.state]) {
      buckets[c.state].push(c.symbol);
    }
  }

  res.json({
    timeframe: "1h",
    buckets
  });
});

/**
 * POST /api/push/subscribe
 * Save push notification subscription
 */
app.post("/api/push/subscribe", (req, res) => {
  try {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: "Invalid subscription"
      });
    }
    
    saveSubscription(subscription);
    
    console.log('✅ Push subscription saved:', subscription.endpoint);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 */
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// ===== SPA FALLBACK (EXPRESS 5 SAFE) =====
// ВАЖНО: именно app.use, а не app.get
app.use((req, res) => {
  res.sendFile(path.join(mobilePath, "index.html"));
});

// ===== START SERVER =====
export function startServer(port = 3000) {
  app.listen(port, () => {
    console.log(`🚀 API server running on http://localhost:${port}`);
  });
}
