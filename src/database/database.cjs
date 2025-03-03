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
  const today = new Date().toISOString().split("T")[0];

  // Fetch today's report
  let report = db.prepare(`
    SELECT 
      total_cards,
      total_active_cards,
      total_inactive_cards,
      total_lost,
      total_transactions,
      total_paid_amount
    FROM report
    WHERE date = ?
  `).get(today);

  if (!report) {
    // If no report exists for today, fetch the latest available report
    report = db.prepare(`
      SELECT 
        total_cards,
        total_active_cards,
        total_inactive_cards,
        total_lost,
        total_transactions,
        total_paid_amount
      FROM report
      ORDER BY date DESC
      LIMIT 1;
    `).get();
  }

  return report || { 
    total_cards: 0,
    total_active_cards: 0,
    total_inactive_cards: 0,
    total_lost: 0,
    total_transactions: 0,
    total_paid_amount: 0
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



function updateDailyReport(newInactiveCards) {
  const today = new Date().toISOString().split("T")[0];

  // Fetch the count of Active, Inactive, and Blocked cards from `payment_cards` table
  const { active, inactive, blocked } = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM payment_cards WHERE status = 'Active') AS active,
      (SELECT COUNT(*) FROM payment_cards WHERE status = 'Inactive') AS inactive,
      (SELECT COUNT(*) FROM payment_cards WHERE status = 'Blocked') AS blocked
  `).get();

  // Check if today's report exists
  const existingReport = db.prepare("SELECT * FROM report WHERE date = ?").get(today);

  if (!existingReport) {
    // Insert a new daily report only for today's new inactive cards
    db.prepare(`
      INSERT INTO report (date, total_cards, total_active_cards, total_inactive_cards, total_lost, total_transactions, total_paid_amount)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `).run(today, active + inactive + blocked, active, inactive, blocked);
  } else {
    // Update today's report with the latest data
    db.prepare(`
      UPDATE report
      SET total_cards = ?, 
          total_active_cards = ?, 
          total_inactive_cards = ?, 
          total_lost = ?
      WHERE date = ?
    `).run(active + inactive + blocked, active, inactive, blocked, today);
  }
}




function topUpCard(barcode, amount) {
  const today = new Date().toISOString().split("T")[0];

  const card = db.prepare("SELECT id, status, credit FROM payment_cards WHERE barcode = ?").get(barcode);

  if (!card) {
    throw new Error("Card not found.");
  }

  const oldBalance = card.credit;
  const newBalance = oldBalance + amount;
  const newStatus = card.status === "Inactive" ? "Active" : card.status;

  // Update card's credit and status
  db.prepare("UPDATE payment_cards SET credit = ?, status = ? WHERE barcode = ?")
    .run(newBalance, newStatus, barcode);

  // Insert into top_up_history
  db.prepare(`
    INSERT INTO top_up_history (card_id, top_up_amount, old_balance, new_balance, date)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(card.id, amount, oldBalance, newBalance);

  // Update the daily report
  const existingReport = db.prepare("SELECT * FROM report WHERE date = ?").get(today);
  
  if (!existingReport) {
    db.prepare(`
      INSERT INTO report (date, total_cards, total_active_cards, total_inactive_cards, total_lost, total_transactions, total_paid_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(today, 1, newStatus === "Active" ? 1 : 0, newStatus === "Inactive" ? 1 : 0, 0, 1, amount);
  } else {
    db.prepare(`
      UPDATE report
      SET total_paid_amount = total_paid_amount + ?,
          total_transactions = total_transactions + 1,
          total_active_cards = total_active_cards + (?),
          total_inactive_cards = total_inactive_cards - (?)
      WHERE date = ?
    `).run(amount, newStatus === "Active" ? 1 : 0, newStatus === "Active" && card.status === "Inactive" ? 1 : 0, today);
  }

  return { success: true, newBalance, newStatus };
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
    creation_date TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);



// Create 'top_up_history' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS top_up_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardID INTEGER NOT NULL,
    top_up_amount REAL NOT NULL,
    old_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (cardID) REFERENCES payment_cards(id)
  )
`);



// Create 'card_types' db 
db.exec(`
  CREATE TABLE IF NOT EXISTS card_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardPrice REAL NOT NULL,
    cardCredit REAL NOT NULL
  )
`);



// create 'report' db 
db.exec(`
  CREATE TABLE IF NOT EXISTS report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    total_cards INTEGER DEFAULT 0,
    total_active_cards INTEGER DEFAULT 0,
    total_inactive_cards INTEGER DEFAULT 0,
    total_lost INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_paid_amount REAL DEFAULT 0
  )
`);



// Export `db` and Functions
module.exports = {
  db,

  getTodayReport, 
  
  createMultipleCards: (quantity) => {
    const stmt = db.prepare("INSERT INTO payment_cards (status, credit, barcode, type, creation_date) VALUES (?, ?, ?, ?, datetime('now'))");

    for (let i = 0; i < quantity; i++) {
      const barcode = generateUPCBarcode();
      stmt.run("Inactive", 0, barcode, 0); 
    }

    updateDailyReport(quantity);
  },


  getAllPaymentCards: () => db.prepare("SELECT id, status, credit, barcode, type, creation_date FROM payment_cards").all(),

  topUpCard,

  getLostCards,

};