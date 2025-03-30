const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const os = require("os");
require("dotenv").config();

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

console.log("📂 Using database file:", dbPath);

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


// Login API
app.post("/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const stmt = db.prepare("SELECT * FROM accounts WHERE phone = ?");
  const user = stmt.get(phone);

  if (!user) {
    return res.status(401).json({ error: "المستخدم غير موجود" });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
  }

  res.json({ success: true, user: { name: user.name, role: user.role } });
});




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





// Health check
app.get("/healthcheck", (req, res) => {
  res.json({ status: "healthy" });
});


// Check connection with client side
app.get("/ping", (req, res) => {
  res.json({ message: "Server is alive" });
});



// Start server
const PORT = process.env.SERVER_PORT;
const HOST = process.env.SERVER_HOST ;

app.listen(PORT, () => {
  console.log(`🟢 Server running at ${HOST}:${PORT}`);
});
