const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

// Define a safe database path
const dbPath = path.join(app.getPath("userData"), "supermarket.db");
console.log("Database Path:", dbPath); 

// Initialize Database
const db = new Database(dbPath, { verbose: console.log });



// fetch latest report
function getTodayReport() {
  // Fetch the count of Active, Inactive, and Blocked cards directly from `payment_cards`
  const report = db.prepare(`
    SELECT 
      COUNT(*) AS total_cards,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS total_active_cards,
      SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS total_inactive_cards,
      SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) AS total_lost_cards
    FROM payment_cards
  `).get();

  return {
    total_cards: report.total_cards || 0,
    total_active_cards: report.total_active_cards || 0,
    total_inactive_cards: report.total_inactive_cards || 0,
    total_lost_cards: report.total_lost_cards || 0,
  };
}







// Generate a unique BARCODE for each card:
function generateUPCBarcode() {
  let base = Math.floor(10000000000 + Math.random() * 90000000000).toString(); 
  let sum = 0;

  // Calculate checksum
  for (let i = 0; i < 11; i++) {
    sum += (i % 2 === 0 ? 3 : 1) * parseInt(base[i]);
  }
  let checksum = (10 - (sum % 10)) % 10;
  return base + checksum; 
}







function topUpCard(barcode, amount, isTopUp = true, selectedCardTypeId = null, bonus = 0) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // **Step 1: Fetch Card Details**
    const card = db.prepare("SELECT id, status, credit FROM payment_cards WHERE barcode = ?").get(barcode);
    if (!card) {
      console.error("Error: Card not found with barcode:", barcode);
      return { error: "Card not found." };
    }

    console.log("Card found:", card);

    const oldBalance = card.credit;
    let newBalance = oldBalance + amount + bonus; // Ensure correct balance calculation

    if (!isTopUp) {
      if (amount > oldBalance) {
        return { error: "رصيد الزبون غير كافي لإتمام العملية" };
      }
      newBalance = oldBalance - amount;
    }

    const wasInactive = card.status === "Inactive";
    const newStatus = wasInactive && isTopUp ? "Active" : card.status;

    // **Step 3: Start Transaction**
    const transaction = db.transaction(() => {
      // **Update `payment_cards`**
      db.prepare(`
        UPDATE payment_cards 
        SET credit = ?, 
            status = ?,
            update_date = datetime('now')
        WHERE barcode = ?
      `).run(newBalance, newStatus, barcode);

      console.log("✅ Payment card updated.");

      // **Insert into `transactions_history`**
      db.prepare(`
        INSERT INTO transactions_history (barcode, amount, bonus, old_balance, new_balance, date)
        VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'))
      `).run(barcode, isTopUp ? amount : -amount, bonus, oldBalance, newBalance);      

      console.log("✅ Transaction recorded in history.");
    });

    transaction(); // **Execute the transaction**
    return { success: true, newBalance, newStatus };

  } catch (error) {
    console.error("❌ Error in `topUpCard`:", error.message);
    return { error: "Failed to process transaction." };
  }
}













// Function to fetch Lost Cards (Blocked status)
const getLostCards = () => {
  return db.prepare("SELECT * FROM payment_cards WHERE status = 'Blocked'").all();
};



// Create payment_cards table
db.exec(`
CREATE TABLE IF NOT EXISTS payment_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK(status IN ('Active', 'Inactive', 'Blocked')),
  credit REAL NOT NULL CHECK(credit >= 0),
  barcode TEXT UNIQUE NOT NULL,
  type INTEGER DEFAULT 0 NOT NULL,
  creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
  update_date TEXT DEFAULT CURRENT_TIMESTAMP
);
`);


// Update cards 'updated_date' automatically 
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_payment_cards_timestamp
  AFTER UPDATE ON payment_cards
  FOR EACH ROW
  BEGIN
    UPDATE payment_cards 
    SET update_date = CURRENT_TIMESTAMP 
    WHERE id = OLD.id;
  END;

  `);


// Create 'transactions_history' table if doesnt exists
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      amount REAL NOT NULL,
      bonus REAL NOT NULL DEFAULT 0,
      old_balance REAL NOT NULL,
      new_balance REAL NOT NULL,
      date TEXT NOT NULL
  );
`);





// Create 'card_types' db 
db.exec(`
  CREATE TABLE IF NOT EXISTS card_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardPrice REAL NOT NULL,
    cardCredit REAL NOT NULL
  )
`);



// Export `db` and Functions
module.exports = {
  db,

  getTodayReport, 
  
  createMultipleCards: (quantity) => {
    const stmt = db.prepare(`
      INSERT INTO payment_cards (status, credit, barcode, type, creation_date, update_date) 
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
  
    for (let i = 0; i < quantity; i++) {
      const barcode = generateUPCBarcode();
      stmt.run("Inactive", 0, barcode, 0);
    }
  
    const today = new Date().toISOString().split("T")[0];
  
    // Fetch the count of Active, Inactive, and Blocked cards **ONLY WHERE `update_date` = TODAY**
    const { active, inactive, blocked } = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) AS active,
        COALESCE(SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END), 0) AS inactive,
        COALESCE(SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END), 0) AS blocked
      FROM payment_cards
      WHERE DATE(update_date) = ?
    `).get(today);
  
    // Calculate total_cards as SUM(active, inactive, blocked) **ONLY FOR TODAY'S UPDATED CARDS**
    const totalCards = active + inactive + blocked;
  
  },

  getAllPaymentCards: () => db.prepare("SELECT id, status, credit, barcode, type, creation_date FROM payment_cards").all(),

  topUpCard,

  getLostCards,

};