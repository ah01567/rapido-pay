const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { db, createMultipleCards, getAllPaymentCards, getTodayReport, getLostCards, topUpCard, getAccounts, addMember, deleteMember, loginUser } = require("./src/database/database.cjs"); 

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const isDev = !app.isPackaged;
  const viteURL = "http://localhost:5173";  
  const prodPath = `file://${path.join(__dirname, "dist", "index.html")}`;

  mainWindow.loadURL(isDev ? viteURL : prodPath);

  console.log(" main.cjs: BrowserWindow created and loading:", isDev ? viteURL : prodPath);

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




// *****************************.   MAIN HANDLES.    ***************************

// Handle searching for a card by barcode
ipcMain.handle("search-card-by-barcode", async (event, barcode) => {
  try {
    const stmt = db.prepare("SELECT * FROM payment_cards WHERE barcode = ?");
    const card = stmt.get(barcode);

    if (card) {
      return card; // Return card details
    } else {
      return { error: "Card not found" };
    }
  } catch (error) {
    console.error("Error fetching card:", error);
    return { error: "Failed to fetch card details" };
  }
});



// Update the type of the Searched Card:
ipcMain.handle("update-card-type", async (event, { barcode, type }) => {
  try {
    const stmt = db.prepare("UPDATE payment_cards SET type = ? WHERE barcode = ?");
    stmt.run(type, barcode);
    return { success: true };
  } catch (error) {
    console.error("Error updating card type:", error);
    return { success: false, error: "Failed to update card type" };
  }
});



// Top up card
ipcMain.handle("top-up-card", async (event, { barcode, amount, isTopUp, selectedCardTypeId = null, bonus = 0 }) => {
  try {
    // **Step 1: Validate Input**
    if (!barcode || isNaN(amount) || amount <= 0) {
      console.error("Invalid transaction request.");
      return { error: "Invalid barcode or amount." };
    }

    console.log(`Processing transaction: Barcode: ${barcode}, Amount: ${amount}, Bonus: ${bonus}, Type: ${isTopUp ? "Top-Up" : "Purchase"}`);

    // **Step 2: Call `topUpCard` function WITH bonus and selectedCardTypeId**
    const result = topUpCard(barcode, parseFloat(amount), isTopUp, selectedCardTypeId, parseFloat(bonus));

    if (result.error) {
      console.error("Transaction failed:", result.error);
      return { error: result.error };
    }

    console.log("Transaction successful:", result);

    return {
      success: true,
      newBalance: result.newBalance,
      newStatus: result.newStatus,
    };

  } catch (error) {
    console.error("Error in `top-up-card`:", error.message);
    return { error: "Failed to process transaction." };
  }
});




// Fetch from transaction history
ipcMain.handle("get-transactions-history", async (event, barcode) => {
  try {
    const stmt = db.prepare("SELECT * FROM transactions_history WHERE barcode = ? ORDER BY date DESC");
    return stmt.all(barcode);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return { error: "Failed to fetch transaction history." };
  }
});



// handle Block an Active card:
ipcMain.handle("block-card", async (event, barcode) => {
  try {
    // Fetch the current card details
    const card = db.prepare("SELECT status FROM payment_cards WHERE barcode = ?").get(barcode);

    if (!card) {
      return { error: "Card not found." };
    }

    if (card.status !== "Active") {
      return { error: "Only active cards can be blocked." };
    }

    // Update card status, reset type, and refresh update_date
    db.prepare(`
      UPDATE payment_cards 
      SET status = 'Blocked', 
          update_date = datetime('now'), 
          type = 0 
      WHERE barcode = ?
    `).run(barcode);

    console.log(`✅ Card ${barcode} has been blocked.`);
    return { success: true };

  } catch (error) {
    console.error("❌ Error blocking card:", error.message);
    return { error: "Failed to block card." };
  }
});



// Fetch transactions history of a card:
ipcMain.handle("get-transaction-history", async (event, barcode) => {
  try {
    const stmt = db.prepare("SELECT date, amount, bonus, old_balance, new_balance FROM transactions_history WHERE barcode = ? ORDER BY date DESC");
    return stmt.all(barcode);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return { error: "Failed to fetch transaction history." };
  }
});


// Handle transfer the money from a blocked card to a new card
ipcMain.handle("transfer-money-to-new-card", async (event, oldBarcode, newBarcode) => {
  try {
    const oldCard = db.prepare("SELECT status, credit FROM payment_cards WHERE barcode = ?").get(oldBarcode);
    const newCard = db.prepare("SELECT status FROM payment_cards WHERE barcode = ?").get(newBarcode);

    if (!oldCard) return { error: "البطاقة القديمة غير موجودة." };
    if (!newCard) return { error: "البطاقة الجديدة غير موجودة." };
    if (oldCard.status !== "Blocked") return { error: "لا يمكن نقل الرصيد إلا من بطاقة محظورة." };
    if (!["Active", "Inactive"].includes(newCard.status)) return { error: "البطاقة الجديدة يجب أن تكون مفعلة أو غير مفعلة." };

    const amountToTransfer = oldCard.credit;
    if (amountToTransfer <= 0) return { error: "لا يوجد رصيد متاح للنقل." };

    // **1️⃣ Withdraw Money from Old Card (by making a "negative top-up" purchase)**
    const withdrawResult = topUpCard(oldBarcode, amountToTransfer, false); // Set `isTopUp = false` to withdraw
    if (withdrawResult.error) return { error: "فشل في خصم الرصيد من البطاقة القديمة." };

    // **2️⃣ Top-Up Money to New Card**
    const topUpResult = topUpCard(newBarcode, amountToTransfer, true); // Set `isTopUp = true` to add balance
    if (topUpResult.error) return { error: "فشل في شحن الرصيد إلى البطاقة الجديدة." };

    console.log(`Successfully transferred ${amountToTransfer} DA from ${oldBarcode} to ${newBarcode}.`);
    return { success: true, newBalance: topUpResult.newBalance };

  } catch (error) {
    console.error("Error transferring money:", error.message);
    return { error: "فشل في تحويل الرصيد." };
  }
});






// Get Today's report function: 
ipcMain.handle("get-today-report", async () => {
  try {
    const report = getTodayReport();
    return report;
  } catch (error) {
    console.error("Error fetching today's report:", error);
    return { error: "Failed to fetch report" };
  }
});


// Fix: Ensure `getAllPaymentCards()` is used correctly
ipcMain.handle("get-payment-cards", async () => {
  try {
    return getAllPaymentCards();
  } catch (error) {
    console.error("Error fetching payment cards:", error);
    return { error: "Failed to fetch payment cards" };
  }
});


// Handle get InactiveCards barcodes:
ipcMain.handle("get-inactive-cards", async () => {
  try {
    const stmt = db.prepare("SELECT barcode FROM payment_cards WHERE status = 'Inactive'");
    return stmt.all().map(row => row.barcode);
  } catch (error) {
    console.error("Error fetching inactive cards:", error);
    return [];
  }
});




// Fetch 'Inactive cards' based on the creation DATE:
ipcMain.handle("get-inactive-cards-grouped", async () => {
  try {
    const groupedCards = db.prepare(`
      SELECT DATE(creation_date) AS creation_date, barcode FROM payment_cards 
      WHERE status = 'Inactive' 
      ORDER BY creation_date DESC
    `).all();

    // Group barcodes by `creation_date` (grouping by DATE only)
    const groupedByDate = groupedCards.reduce((acc, card) => {
      if (!acc[card.creation_date]) acc[card.creation_date] = [];
      acc[card.creation_date].push(card.barcode);
      return acc;
    }, {});

    return groupedByDate;
  } catch (error) {
    console.error("Error fetching inactive cards by date:", error);
    return {};
  }
});





// Fetch Active Cards
ipcMain.handle("get-active-cards", async () => {
  try {
    const activeCards = db.prepare("SELECT barcode, credit, creation_date, status FROM payment_cards WHERE status = 'Active'").all();
    return activeCards;
  } catch (error) {
    console.error("Error fetching active cards:", error);
    return [];
  }
});




// Handle fetching lost (blocked) cards
ipcMain.handle("get-lost-cards", async () => {
  return getLostCards();
});




// Fix: Ensure `createMultipleCards()` is used correctly
ipcMain.handle("create-multiple-cards", async (event, quantity) => {
  try {
    createMultipleCards(quantity); 
    return { success: true };
  } catch (error) {
    console.error(" Error creating cards:", error);
    return { error: "Failed to create cards" };
  }
});


// Fix: Use `db.prepare()` correctly for `card_types`
ipcMain.handle("save-card-type", async (event, { cardPrice, cardCredit }) => {
  try {
    console.log("Saving new card type to database...", { cardPrice, cardCredit });

    // Fix: Ensure `db` is used correctly
    const stmt = db.prepare("INSERT INTO card_types (cardPrice, cardCredit) VALUES (?, ?)");
    const result = stmt.run(cardPrice, cardCredit);

    console.log("Card saved successfully with ID:", result.lastInsertRowid);
    return { success: true, insertedId: result.lastInsertRowid };
  } catch (error) {
    console.error("Error saving card type:", error);
    return { success: false, error: "Failed to save card type" };
  }
});



// Fix: Ensure `db` is used correctly for fetching `card_types`
ipcMain.handle("get-card-types", async () => {
  try {
    console.log(" Fetching card types from the database...");
    const stmt = db.prepare("SELECT id, cardPrice, cardCredit FROM card_types");
    const savedCards = stmt.all();
    console.log(" Retrieved card types:", savedCards);
    return savedCards;
  } catch (error) {
    console.error(" Error fetching card types:", error);
    return { error: "Failed to fetch card types" };
  }
});


// Handle deleting a card from the database
ipcMain.handle("delete-card-type", async (event, cardTypeId) => {
  try {
    console.log("Deleting card type with ID:", cardTypeId);

    // Step 1: Delete the card type
    const stmt = db.prepare("DELETE FROM card_types WHERE id = ?");
    const result = stmt.run(cardTypeId);

    if (result.changes > 0) {
      console.log("Card type deleted successfully!");

      // Step 2: Update `payment_cards` that had this type to `0`
      const updateStmt = db.prepare("UPDATE payment_cards SET type = 0 WHERE type = ?");
      updateStmt.run(cardTypeId);

      console.log("Updated all payment_cards with this type to 0.");
      
      return { success: true };
    } else {
      console.error("No card type found to delete.");
      return { success: false, error: "Card type not found." };
    }
  } catch (error) {
    console.error("Error deleting card type:", error);
    return { success: false, error: "Failed to delete card type." };
  }
});






ipcMain.handle("get-total-analytics", async () => {
  try {
    // Get total income (sum of positive amounts)
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS income 
      FROM transactions_history 
      WHERE amount > 0
    `).get().income;

    // Get total purchases (sum of negative amounts)
    const totalPurchases = db.prepare(`
      SELECT COALESCE(ABS(SUM(amount)), 0) AS purchases 
      FROM transactions_history 
      WHERE amount < 0
    `).get().purchases;

    // Get the total number of transactions
    const totalTransactions = db.prepare(`
      SELECT COUNT(*) AS count FROM transactions_history
    `).get().count;

    // Get the number of unique transaction days
    const uniqueDays = db.prepare(`
      SELECT COUNT(DISTINCT DATE(date)) AS unique_days FROM transactions_history
    `).get().unique_days;

    // Get total sum of positive transactions
    const totalTopUpAmount = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS topup_total 
      FROM transactions_history 
      WHERE amount > 0
    `).get().topup_total;

    // Get total number of top-up transactions
    const topUpCount = db.prepare(`
      SELECT COUNT(*) AS topup_count 
      FROM transactions_history 
      WHERE amount > 0
    `).get().topup_count;

    // Calculate averages
    const avgTopUpAmount = topUpCount > 0 ? Math.round(totalTopUpAmount / topUpCount) : 0;
    const avgDailyTransactions = uniqueDays > 0 ? Math.round(totalTransactions / uniqueDays) : 0;

    return {
      totalIncome,
      totalPurchases,
      avgTopUpAmount,
      avgDailyTransactions,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { error: "Failed to fetch analytics." };
  }
});


// Fetch the distribution of the Card Types:
ipcMain.handle("get-card-type-distribution", async () => {
  try {
    const cardTypeCounts = db.prepare(`
      SELECT type, COUNT(*) AS count
      FROM payment_cards
      WHERE type > 0
      GROUP BY type
    `).all();

    // Fetch card type labels from `card_types` table
    const cardTypes = db.prepare(`
      SELECT id, cardPrice 
      FROM card_types
    `).all();

    // Map the IDs to their actual price names
    const formattedData = cardTypeCounts.map((entry) => {
      const cardType = cardTypes.find((type) => type.id === entry.type);
      return {
        name: cardType ? `Card ${cardType.cardPrice} DA` : "Unknown",
        value: entry.count,
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching card type distribution:", error);
    return { error: "Failed to fetch card type distribution." };
  }
});




// Get Daily Income for a week:
const weekDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

ipcMain.handle("get-daily-income", async () => {
  try {
    const dailyIncome = db.prepare(`
      SELECT 
        strftime('%w', date) AS weekday, 
        SUM(amount) AS total_income 
      FROM transactions_history 
      WHERE amount > 0 
        AND date >= date('now', 'weekday 0', '-6 days') -- Get transactions from current week
      GROUP BY weekday
    `).all();

    // Convert database weekday (0-6) to labeled days (Sunday-Saturday)
    const formattedData = weekDays.map((day, index) => {
      const dayData = dailyIncome.find(d => parseInt(d.weekday) === index);
      return {
        day: day,
        income: dayData ? dayData.total_income : 0,
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching daily income:", error);
    return { error: "Failed to fetch daily income." };
  }
});




// Fetch the Users account
ipcMain.handle("get-accounts", async () => {
  try {
    const accounts = getAccounts();
    return accounts;
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return { error: "Failed to fetch accounts" };
  }
});


// Add new account
ipcMain.handle('add-member', async (event, memberData) => {
  try {
    return await addMember(memberData);
  } catch (error) {
    console.error("Error in add-member handler:", error);
    return { success: false, error: "Failed to add member" };
  }
});


// Delete account
ipcMain.handle("delete-member", async (event, id) => {
  try {
    return deleteMember(id);
  } catch (error) {
    console.error("IPC delete-member error:", error);
    return { success: false, error: "IPC delete failed" };
  }
});




// login into an account
ipcMain.handle("login-user", async (event, { phone, password }) => {
  return await loginUser(phone, password);
});



// Function to create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  mainWindow.loadURL(isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "dist", "index.html")}`);
}
