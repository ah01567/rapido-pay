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
  // Sum all values across the entire report table
  const report = db.prepare(`
    SELECT 
      COALESCE(SUM(total_cards), 0) AS total_cards,
      COALESCE(SUM(total_active_cards), 0) AS total_active_cards,
      COALESCE(SUM(total_inactive_cards), 0) AS total_inactive_cards,
      COALESCE(SUM(total_lost_cards), 0) AS total_lost_cards,
      COALESCE(SUM(total_transactions), 0) AS total_transactions,
      COALESCE(SUM(total_income), 0) AS total_income
    FROM report
  `).get();

  return report;
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



function updateDailyReport() {
  const today = new Date().toISOString().split("T")[0];

  // Fetch the number of cards that CHANGED STATUS today
  const { activatedToday, blockedToday } = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM payment_cards WHERE status = 'Active' AND DATE(update_date) = ?) AS activatedToday,
      (SELECT COUNT(*) FROM payment_cards WHERE status = 'Blocked' AND DATE(update_date) = ?) AS blockedToday
  `).get(today, today);

  // Fetch the number of cards CREATED today
  const { createdInactive } = db.prepare(`
    SELECT COUNT(*) AS createdInactive FROM payment_cards WHERE status = 'Inactive' AND DATE(creation_date) = ?
  `).get(today);

  // Check if today's report exists
  const existingReport = db.prepare("SELECT * FROM report WHERE date = ?").get(today);

  if (!existingReport) {
    // Create a new report for today
    db.prepare(`
      INSERT INTO report (date, total_cards, total_active_cards, total_inactive_cards, total_lost, total_transactions, total_paid_amount)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `).run(today, createdInactive, activatedToday, createdInactive - activatedToday, blockedToday);
  } else {
    // Update today's report
    db.prepare(`
      UPDATE report
      SET total_active_cards = total_active_cards + ?,
          total_inactive_cards = total_inactive_cards - ?,
          total_lost = total_lost + ?
      WHERE date = ?
    `).run(activatedToday, activatedToday, blockedToday, today);
  }
}








function topUpCard(barcode, amount) {
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
    const newBalance = oldBalance + amount;
    const wasInactive = card.status === "Inactive"; 

    const newStatus = wasInactive ? "Active" : card.status;

    // **Step 2: Start Transaction**
    const transaction = db.transaction(() => {
      // **Update `payment_cards`**
      db.prepare(`
        UPDATE payment_cards 
        SET credit = ?, 
            status = ?
        WHERE barcode = ?
      `).run(newBalance, newStatus, barcode);

      console.log("✅ Payment card updated.");

      // **Insert into `top_up_history`**
      db.prepare(`
        INSERT INTO top_up_history (barcode, top_up_amount, old_balance, new_balance, date)
        VALUES (?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%S', 'now'))
      `).run(barcode, amount, oldBalance, newBalance);

      console.log("✅ Top-up history recorded.");

      // **Check if today's report exists**
      let report = db.prepare("SELECT id FROM report WHERE date = ?").get(today);

      if (!report) {
        // **If today's report doesn't exist, create it**
        db.prepare(`
          INSERT INTO report (date, total_cards, total_active_cards, total_inactive_cards, total_lost_cards, total_transactions, total_income)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(today, 0, wasInactive ? 1 : 0, wasInactive ? 0 : 1, 0, 1, amount);

        console.log("✅ New report created for today.");
      } else {
        // ✅ **Update report**
        db.prepare(`
          UPDATE report
          SET total_active_cards = total_active_cards + ?,
              total_inactive_cards = total_inactive_cards - ?,
              total_transactions = total_transactions + 1,
              total_income = total_income + ?,
              total_cards = total_active_cards + total_inactive_cards + total_lost_cards
          WHERE date = ?
        `).run(wasInactive ? 1 : 0, wasInactive ? 1 : 0, amount, today);

        console.log("✅ Report updated.");
      }
    });

    transaction(); // **Execute the transaction**
    return { success: true, newBalance, newStatus };

  } catch (error) {
    console.error("❌ Error in `topUpCard`:", error.message);
    return { error: "Failed to top up card." };
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


// Create 'top_up_history' table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS top_up_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      top_up_amount REAL NOT NULL,
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



// create 'report' db 
db.exec(`
CREATE TABLE IF NOT EXISTS report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  total_cards INTEGER DEFAULT 0,
  total_active_cards INTEGER DEFAULT 0,
  total_inactive_cards INTEGER DEFAULT 0,
  total_lost_cards INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_income REAL DEFAULT 0
);
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
  
    // Check if today's report exists
    const existingReport = db.prepare("SELECT id FROM report WHERE date = ?").get(today);
  
    if (!existingReport) {
      // **FIX:** Ensure report only considers today's updated cards
      db.prepare(`
        INSERT INTO report (date, total_cards, total_active_cards, total_inactive_cards, total_lost_cards, total_transactions, total_income)
        VALUES (?, ?, ?, ?, ?, 0, 0)
      `).run(today, totalCards, active, inactive, blocked);
    } else {
      // **FIX:** Ensure the update only modifies today's report
      db.prepare(`
        UPDATE report
        SET total_cards = ?, 
            total_active_cards = ?, 
            total_inactive_cards = ?, 
            total_lost_cards = ?
        WHERE date = ?
      `).run(totalCards, active, inactive, blocked, today);
    }
  },

  getAllPaymentCards: () => db.prepare("SELECT id, status, credit, barcode, type, creation_date FROM payment_cards").all(),

  topUpCard,

  getLostCards,

};