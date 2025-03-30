const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  db, // ✅ ADD THIS
  getLostCards,
  loginUser,
  topUpCard,
  getTodayReport,
  getAllPaymentCards,
  getAccounts,
  addMember,
  deleteMember,
  createMultipleCards
} = require('./src/database/database.cjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

let mainWindow;


const isDev = !app.isPackaged;
const devServerURL = 'http://192.168.1.43:2001';
const prodPath = path.join(__dirname, "dist", "index.html"); // Correct production path

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Disable for local development
    },
  });

  // Enhanced loading with WebSocket support
  const loadApp = async () => {
    try {
      const url = isDev ? devServerURL : `file://${prodPath}`;
      console.log('Loading URL:', url);
      
      await mainWindow.loadURL(url);
      
      // Verify WebSocket connection
      mainWindow.webContents.executeJavaScript(`
        new WebSocket('ws://192.168.1.43:1966').addEventListener('open', () => {  // ← Changed IP
          console.log('WebSocket connected');
        });
      `);

    } catch (err) {
      console.error('Load failed:', err);
      mainWindow.loadURL(`data:text/html,
        <h1>Load Error</h1>
        <p>${err.message}</p>
        <p>Attempted URL: ${isDev ? devServerURL : prodPath}</p>
      `);
    }
  };

  loadApp();

}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ***************************** IPC HANDLERS ***************************

// Card Management Handlers
ipcMain.handle("search-card-by-barcode", async (event, barcode) => {
  try {
    const stmt = db.prepare("SELECT * FROM payment_cards WHERE barcode = ?");
    const card = stmt.get(barcode);
    return card || { error: "Card not found" };
  } catch (error) {
    console.error("Error fetching card:", error);
    return { error: "Failed to fetch card details" };
  }
});

ipcMain.handle("update-card-type", async (event, { barcode, type }) => {
  try {
    db.prepare("UPDATE payment_cards SET type = ? WHERE barcode = ?").run(type, barcode);
    return { success: true };
  } catch (error) {
    console.error("Error updating card type:", error);
    return { success: false, error: "Failed to update card type" };
  }
});

ipcMain.handle("top-up-card", async (event, { barcode, amount, isTopUp, selectedCardTypeId = null, bonus = 0 }) => {
  try {
    if (!barcode || isNaN(amount) || amount <= 0) {
      return { error: "Invalid barcode or amount." };
    }

    const result = topUpCard(barcode, parseFloat(amount), isTopUp, selectedCardTypeId, parseFloat(bonus));
    return result.error ? { error: result.error } : {
      success: true,
      newBalance: result.newBalance,
      newStatus: result.newStatus,
    };
  } catch (error) {
    console.error("Error in top-up-card:", error.message);
    return { error: "Failed to process transaction." };
  }
});

// Transaction History Handlers
ipcMain.handle("get-transactions-history", async (event, barcode) => {
  try {
    return db.prepare("SELECT * FROM transactions_history WHERE barcode = ? ORDER BY date DESC").all(barcode);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return { error: "Failed to fetch transaction history." };
  }
});

ipcMain.handle("get-transaction-history", async (event, barcode) => {
  try {
    return db.prepare(`
      SELECT date, amount, bonus, old_balance, new_balance 
      FROM transactions_history 
      WHERE barcode = ? 
      ORDER BY date DESC
    `).all(barcode);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return { error: "Failed to fetch transaction history." };
  }
});

// Card Status Handlers
ipcMain.handle("block-card", async (event, barcode) => {
  try {
    const card = db.prepare("SELECT status FROM payment_cards WHERE barcode = ?").get(barcode);
    if (!card) return { error: "Card not found." };
    if (card.status !== "Active") return { error: "Only active cards can be blocked." };

    db.prepare(`
      UPDATE payment_cards 
      SET status = 'Blocked', update_date = datetime('now'), type = 0 
      WHERE barcode = ?
    `).run(barcode);
    return { success: true };
  } catch (error) {
    console.error("Error blocking card:", error.message);
    return { error: "Failed to block card." };
  }
});

ipcMain.handle("transfer-money-to-new-card", async (event, oldBarcode, newBarcode) => {
  try {
    const oldCard = db.prepare("SELECT status, credit FROM payment_cards WHERE barcode = ?").get(oldBarcode);
    const newCard = db.prepare("SELECT status FROM payment_cards WHERE barcode = ?").get(newBarcode);

    if (!oldCard) return { error: "Old card not found." };
    if (!newCard) return { error: "New card not found." };
    if (oldCard.status !== "Blocked") return { error: "Only blocked cards can transfer money." };
    if (!["Active", "Inactive"].includes(newCard.status)) return { error: "New card must be active or inactive." };

    const amountToTransfer = oldCard.credit;
    if (amountToTransfer <= 0) return { error: "No balance available to transfer." };

    const withdrawResult = topUpCard(oldBarcode, amountToTransfer, false);
    if (withdrawResult.error) return { error: withdrawResult.error };

    const topUpResult = topUpCard(newBarcode, amountToTransfer, true);
    if (topUpResult.error) return { error: topUpResult.error };

    return { success: true, newBalance: topUpResult.newBalance };
  } catch (error) {
    console.error("Error transferring money:", error.message);
    return { error: "Failed to transfer balance." };
  }
});

// Report and Analytics Handlers
ipcMain.handle("get-today-report", async () => {
  try {
    return getTodayReport();
  } catch (error) {
    console.error("Error fetching today's report:", error);
    return { error: "Failed to fetch report" };
  }
});

ipcMain.handle("get-payment-cards", async () => {
  try {
    return getAllPaymentCards();
  } catch (error) {
    console.error("Error fetching payment cards:", error);
    return { error: "Failed to fetch payment cards" };
  }
});

ipcMain.handle("get-inactive-cards", async () => {
  try {
    return db.prepare("SELECT barcode FROM payment_cards WHERE status = 'Inactive'")
      .all()
      .map(row => row.barcode);
  } catch (error) {
    console.error("Error fetching inactive cards:", error);
    return [];
  }
});

ipcMain.handle("get-inactive-cards-grouped", async () => {
  try {
    const groupedCards = db.prepare(`
      SELECT DATE(creation_date) AS creation_date, barcode 
      FROM payment_cards 
      WHERE status = 'Inactive' 
      ORDER BY creation_date DESC
    `).all();

    return groupedCards.reduce((acc, card) => {
      if (!acc[card.creation_date]) acc[card.creation_date] = [];
      acc[card.creation_date].push(card.barcode);
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching inactive cards by date:", error);
    return {};
  }
});

ipcMain.handle("get-active-cards", async () => {
  try {
    return db.prepare("SELECT barcode, credit, creation_date, status FROM payment_cards WHERE status = 'Active'").all();
  } catch (error) {
    console.error("Error fetching active cards:", error);
    return [];
  }
});

ipcMain.handle("get-lost-cards", async () => {
  return getLostCards();
});

// Card Type Management Handlers
ipcMain.handle("create-multiple-cards", async (event, quantity) => {
  try {
    createMultipleCards(quantity);
    return { success: true };
  } catch (error) {
    console.error("Error creating cards:", error);
    return { error: "Failed to create cards" };
  }
});

ipcMain.handle("save-card-type", async (event, { cardPrice, cardCredit }) => {
  try {
    const stmt = db.prepare("INSERT INTO card_types (cardPrice, cardCredit) VALUES (?, ?)");
    const result = stmt.run(cardPrice, cardCredit);
    return { success: true, insertedId: result.lastInsertRowid };
  } catch (error) {
    console.error("Error saving card type:", error);
    return { success: false, error: "Failed to save card type" };
  }
});

ipcMain.handle("get-card-types", async () => {
  try {
    const types = db.prepare("SELECT id, cardPrice, cardCredit FROM card_types").all();
    console.log("📦 Card types fetched:", types);
    return types;
  } catch (error) {
    console.error("Error fetching card types:", error);
    return { error: "Failed to fetch card types" };
  }
});


ipcMain.handle("delete-card-type", async (event, cardTypeId) => {
  try {
    const result = db.prepare("DELETE FROM card_types WHERE id = ?").run(cardTypeId);
    if (result.changes > 0) {
      db.prepare("UPDATE payment_cards SET type = 0 WHERE type = ?").run(cardTypeId);
      return { success: true };
    }
    return { success: false, error: "Card type not found." };
  } catch (error) {
    console.error("Error deleting card type:", error);
    return { success: false, error: "Failed to delete card type." };
  }
});

// Analytics Handlers
ipcMain.handle("get-total-analytics", async () => {
  try {
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS income 
      FROM transactions_history 
      WHERE amount > 0
    `).get().income;

    const totalPurchases = db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) AS purchases 
      FROM transactions_history 
      WHERE amount < 0
    `).get().purchases;

    const totalTransactions = db.prepare(`
      SELECT COUNT(*) AS count FROM transactions_history
    `).get().count;

    const uniqueDays = db.prepare(`
      SELECT COUNT(DISTINCT DATE(date)) AS unique_days FROM transactions_history
    `).get().unique_days;

    const totalTopUpAmount = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS topup_total 
      FROM transactions_history 
      WHERE amount > 0
    `).get().topup_total;

    const topUpCount = db.prepare(`
      SELECT COUNT(*) AS topup_count 
      FROM transactions_history 
      WHERE amount > 0
    `).get().topup_count;

    return {
      totalIncome,
      totalPurchases,
      avgTopUpAmount: topUpCount > 0 ? Math.round(totalTopUpAmount / topUpCount) : 0,
      avgDailyTransactions: uniqueDays > 0 ? Math.round(totalTransactions / uniqueDays) : 0,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { error: "Failed to fetch analytics." };
  }
});

const weekDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

ipcMain.handle("get-daily-income", async () => {
  try {
    const dailyIncome = db.prepare(`
      SELECT strftime('%w', date) AS weekday, SUM(amount) AS total_income 
      FROM transactions_history 
      WHERE amount > 0 AND date >= date('now', 'weekday 0', '-6 days')
      GROUP BY weekday
    `).all();

    return weekDays.map((day, index) => ({
      day: day,
      income: dailyIncome.find(d => parseInt(d.weekday) === index)?.total_income || 0,
    }));
  } catch (error) {
    console.error("Error fetching daily income:", error);
    return { error: "Failed to fetch daily income." };
  }
});

ipcMain.handle("get-card-type-distribution", async () => {
  try {
    const cardTypeCounts = db.prepare(`
      SELECT type, COUNT(*) AS count
      FROM payment_cards
      WHERE type > 0
      GROUP BY type
    `).all();

    const cardTypes = db.prepare("SELECT id, cardPrice FROM card_types").all();

    return cardTypeCounts.map((entry) => ({
      name: cardTypes.find((type) => type.id === entry.type)?.cardPrice 
        ? `Card ${cardTypes.find((type) => type.id === entry.type).cardPrice} DA` 
        : "Unknown",
      value: entry.count,
    }));
  } catch (error) {
    console.error("Error fetching card type distribution:", error);
    return { error: "Failed to fetch card type distribution." };
  }
});

// User Account Handlers
ipcMain.handle("get-accounts", async () => {
  try {
    return getAccounts();
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return { error: "Failed to fetch accounts" };
  }
});

ipcMain.handle('add-member', async (event, memberData) => {
  try {
    return await addMember(memberData);
  } catch (error) {
    console.error("Error in add-member handler:", error);
    return { success: false, error: "Failed to add member" };
  }
});

ipcMain.handle("delete-member", async (event, id) => {
  try {
    return deleteMember(id);
  } catch (error) {
    console.error("IPC delete-member error:", error);
    return { success: false, error: "IPC delete failed" };
  }
});

ipcMain.handle("login-user", async (event, { phone, password }) => {
  return await loginUser(phone, password);
});