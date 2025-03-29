const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const os = require("os");

app.use(cors());
app.use(express.json());

// Database configuration
const dbPath = process.env.DB_PATH || path.join(
  os.homedir(),
  process.platform === "darwin"
    ? "Library/Application Support/rapidopay/supermarket.db"
    : process.platform === "win32"
    ? "AppData/Roaming/rapidopay/supermarket.db"
    : ".config/rapidopay/supermarket.db" 
);


const fs = require("fs");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}



// Database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database:", dbPath);
});

// API Endpoints

// Search card by barcode
app.get("/card/:barcode", (req, res) => {
  const barcode = req.params.barcode;

  if (!barcode || !/^\d+$/.test(barcode)) {
    return res.status(400).json({ error: "Invalid barcode format" });
  }

  db.get("SELECT * FROM payment_cards WHERE barcode = ?", [barcode], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(row || { error: "Card not found" });
  });
});

// Fetch transaction history
app.get("/transactions/:barcode", (req, res) => {
  const barcode = req.params.barcode;

  db.all(
    "SELECT date, amount, bonus, old_balance, new_balance FROM transactions_history WHERE barcode = ? ORDER BY date DESC",
    [barcode],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});



// Purchase only (users cannot top up)
app.post('/top-up', (req, res) => {
  const { barcode, amount } = req.body;

  if (!barcode || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // 1. Fetch current card balance
  db.get("SELECT credit FROM payment_cards WHERE barcode = ?", [barcode], (err, card) => {
    if (err || !card) {
      return res.status(500).json({ error: "Card not found or DB error" });
    }

    const oldBalance = card.credit;
    const newBalance = oldBalance - amount;

    // 2. Reject if balance would go negative
    if (newBalance < 0) {
      return res.status(400).json({ error: "رصيد غير كافي" });
    }

    // 3. Update card balance
    db.run("UPDATE payment_cards SET credit = ? WHERE barcode = ?", [newBalance, barcode], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: "Failed to update balance" });
      }

      // 4. Log the transaction
      const dateNow = new Date().toISOString().replace("T", " ").split(".")[0];
      db.run(
        `INSERT INTO transactions_history 
         (barcode, date, amount, bonus, old_balance, new_balance) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          barcode,
          dateNow,
          -amount,        // always negative
          0,              // no bonus in purchases
          oldBalance,
          newBalance,
        ],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: "Failed to log transaction" });
          }

          res.json({
            success: true,
            oldBalance,
            newBalance,
            type: "Purchase",
          });
        }
      );
    });
  });
});





// Transaction history money
app.get("/transactions/:barcode", (req, res) => {
  const barcode = req.params.barcode;

  db.all(
    "SELECT date, amount, bonus, old_balance, new_balance FROM transactions_history WHERE barcode = ? ORDER BY date DESC",
    [barcode],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});



// Health check
app.get("/healthcheck", (req, res) => {
  res.json({ status: "healthy" });
});

// Start server
app.listen(3001, () => {
  console.log("🟢 Server running at http://localhost:3001");
});