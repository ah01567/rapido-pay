const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload.js is loaded and running!"); 

contextBridge.exposeInMainWorld("api", {

  searchCardByBarcode: (barcode) => ipcRenderer.invoke("search-card-by-barcode", barcode),
  updateCardType: (barcode, type) => ipcRenderer.invoke("update-card-type", { barcode, type }),
  topUpCard: (data) => ipcRenderer.invoke("top-up-card", data),
  blockCard: (barcode) => ipcRenderer.invoke("block-card", barcode),

  getTodayReport: () => ipcRenderer.invoke("get-today-report"),

  getPaymentCards: () => ipcRenderer.invoke("get-payment-cards"),
  getInactiveCards: () => ipcRenderer.invoke("get-inactive-cards"),
  getInactiveCardsGroupedByDate: () => ipcRenderer.invoke("get-inactive-cards-grouped"),
  getActiveCards: () => ipcRenderer.invoke("get-active-cards"),
  getLostCards: () => ipcRenderer.invoke("get-lost-cards"),
  createMultipleCards: (quantity) => ipcRenderer.invoke("create-multiple-cards", quantity),
  
  saveCardType: (cardData) => ipcRenderer.invoke("save-card-type", cardData),  
  getCardTypes: () => ipcRenderer.invoke("get-card-types"), 
  deleteCardType: (cardId) => ipcRenderer.invoke("delete-card-type", cardId), 
});

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  },
});
