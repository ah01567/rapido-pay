import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { IoCartOutline } from "react-icons/io5";
import { MdAddCard } from "react-icons/md";
import { HiOutlineArrowsRightLeft } from "react-icons/hi2";
import { TbReportSearch } from "react-icons/tb";
import { FaBan } from "react-icons/fa";

const CardSearchModal = ({ isOpen, onClose, card }) => {
  if (!isOpen || !card) return null;

  const [cardTypes, setCardTypes] = useState([]);
  const [selectedCardType, setSelectedCardType] = useState("0");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState(""); 
  const [transactionAmount, setTransactionAmount] = useState("");
  const [showTypeConfirmation, setShowTypeConfirmation] = useState(false);
  const [selectedTypeToConfirm, setSelectedTypeToConfirm] = useState(null);
  const [selectedTypeCredit, setSelectedTypeCredit] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newCardBarcode, setNewCardBarcode] = useState("");
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactions, setTransactions] = useState([]);





  useEffect(() => {
    if (window.api) {
      window.api.getCardTypes()
        .then((data) => {
          setCardTypes(data || []);
        })
        .catch((error) => console.error("Error fetching card types:", error));
    }
  }, []);



// Function to Handle Type Selection
const handleCardTypeChange = (newType) => {
  const selectedType = cardTypes.find((type) => type.id == newType);
  
  if (selectedType) {
    setSelectedTypeToConfirm(newType); // Store Type ID
    setSelectedTypeCredit(selectedType.cardCredit); // Store Credit Amount
    setShowTypeConfirmation(true); // Open Confirmation Modal
  }
};



// Function to Confirm and Apply the Selected Card Type
const confirmCardTypeSelection = () => {
  if (!selectedTypeToConfirm || !selectedTypeCredit) return;

  const selectedType = cardTypes.find((type) => type.id == selectedTypeToConfirm);
  if (!selectedType) return;

  const actualAmount = selectedType.cardPrice; // Use cardPrice, not cardCredit
  const bonus = selectedType.cardCredit - selectedType.cardPrice; // Calculate the correct bonus

  window.api.updateCardType(card.barcode, selectedTypeToConfirm)
    .then(() => {
      console.log("✅ Card type updated successfully!");

      window.api.topUpCard({
        barcode: card.barcode,
        amount: actualAmount,  // Now sending the correct `amount`
        isTopUp: true,
        selectedCardTypeId: selectedTypeToConfirm, 
        bonus: bonus // Send the correct bonus
      })
      .then((response) => {
        if (response.error) {
          alert("خطأ في الشحن: " + response.error);
        } else {
          alert(`✅ تم تحديث نوع البطاقة وشحنها بنجاح! الرصيد الحالي: ${response.newBalance} DA`);
          setSelectedCardType(selectedTypeToConfirm); // Update UI
        }
      })
      .catch((error) => console.error("❌ Error in top-up:", error));
    })
    .catch((error) => console.error("❌ Error updating card type:", error));

  setShowTypeConfirmation(false);
};


  


// Handle 'Top up' OR 'Buy' based on the clicked button:
const handleTransaction = (type) => {
  setTransactionType(type);
  setTransactionAmount(""); 
  setShowTransactionModal(true); 
};

// Process 'Top up' OR 'Buy' based on the clicked button:
const processTransaction = () => {
  if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
    alert("يرجى إدخال مبلغ صالح.");
    return;
  }

  const isTopUp = transactionType === "topUp";
  let selectedCardTypeId = isTopUp && selectedCardType !== "0" ? selectedCardType : null;
  let finalAmount = parseFloat(transactionAmount);
  let bonus = 0; // Default bonus is 0

  // If a card type is selected, get its bonus
  if (selectedCardTypeId) {
    const selectedType = cardTypes.find(ct => ct.id == selectedCardTypeId);
    if (selectedType) {
      finalAmount = selectedType.cardPrice; // Save `cardPrice` as the amount
      bonus = selectedType.cardCredit - selectedType.cardPrice; // Save bonus separately
    }
  }

  window.api.topUpCard({ 
    barcode: card.barcode, 
    amount: finalAmount,  
    isTopUp,
    selectedCardTypeId,
    bonus
  })
  .then((response) => {
    if (response.error) {
      alert(response.error);
    } else {
      alert(`✅ ${isTopUp ? "تم الشحن بنجاح!" : "تم الشراء بنجاح!"} الرصيد الحالي: ${response.newBalance} DA`);
      onClose(); 
    }
  })
  .catch((error) => console.error("Error:", error));

  setShowTransactionModal(false); 
};




  



  
  // Block Card function
  const handleBlockCard = () => {
    if (card.status !== "Active") {
      alert("لا يمكن حظر هذه البطاقة لأنها ليست مفعلة.");
      return;
    }
  
    if (!window.confirm("هل أنت متأكد أنك تريد حظر هذه البطاقة؟")) return;
  
    window.api.blockCard(card.barcode)
      .then((response) => {
        if (response.error) {
          alert("خطأ: " + response.error);
        } else {
          alert("✅ تم حظر البطاقة بنجاح!");
          onClose(); // Close modal after blocking
        }
      })
      .catch((error) => console.error("❌ Error blocking card:", error));
  };  

  

  // Transactions history
  const fetchTransactionHistory = () => {
    if (showTransactionHistory) {
      setShowTransactionHistory(false); 
      return;
    }
  
    window.api.getTransactionHistory(card.barcode)
      .then((data) => {
        if (data.error) {
          console.error("Error fetching transaction history:", data.error);
        } else {
          setTransactions(data);
          setShowTransactionHistory(true);
        }
      })
      .catch((error) => console.error("Error fetching transaction history:", error));
  };  

  

  // Transfer the Money from a BLOCKED CARD to a NEW CARD:
  const handleTransferMoney = () => {
    if (!newCardBarcode) {
      alert("الرجاء إدخال الباركود الخاص بالبطاقة الجديدة.");
      return;
    }
  
    if (!window.confirm("هل أنت متأكد أنك تريد نقل الأموال إلى البطاقة الجديدة؟")) return;
  
    window.api.transferMoneyToNewCard(card.barcode, newCardBarcode)
      .then((response) => {
        if (response.error) {
          alert("❌ خطأ: " + response.error);
        } else {
          alert("✅ تم تحويل الرصيد بنجاح!");
          onClose(); // Close modal after success
        }
      })
      .catch((error) => console.error("❌ Error transferring money:", error));
  };

  


  if (!isOpen || !card) return null;
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
        style={{ width: "60%", height: "55%", overflowY: "auto" }} 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-7">معلومات البطاقة</h2>

        {/* Flex container for two boxes */}
        <div className="flex w-full justify-between gap-3">

          {/* Left Box */}
          <div className="w-2/5 p-4 rounded-lg shadow-sm text-right border border-gray">
            <p 
                className={`flex items-center px-3 py-1 rounded-lg text-lg font-semibold ${
                    card.status === "Active"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
                >
                <span 
                    className={`w-3 h-3 rounded-full mr-2 ${
                    card.status === "Active" ? "bg-green-600" : "bg-red-600"
                    }`}
                ></span>
                {card.status}
            </p>

            <div className="text-lg mt-5 flex items-center">
              {card.status === "Blocked" ? (
                <p className="text-red-600 bg-white p-3 rounded-lg text-center w-full">
                  تم حظر هذه البطاقة بناءً على طلب العميل بسبب الفقدان أو السرقة
                </p>
              ) : (
                <>
                  <strong className="mr-2">Card:</strong>
                  <select
                    className="border border-gray-300 px-3 py-1 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCardType} 
                    onChange={(e) => handleCardTypeChange(e.target.value)}
                  >
                    {/* Default option for "لا توجد" if TYPE is 0 */}
                    <option value="0">
                      لا توجد
                    </option>

                    {/* Dynamically loading available card types */}
                    {cardTypes.map((cardType) => (
                      <option key={cardType.id} value={cardType.id}>
                        {cardType.cardPrice} DA
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="flex flex-col items-center mt-5">
                <Barcode value={card.barcode} />
            </div>
          </div>


          {/* Right Box */}
          <div className="w-3/5 p-4 rounded-lg shadow-sm text-center border border-gray">
            <p className="text-2xl font-semibold" style={{ color: '#4b4b4b' }}>
              {card.credit} DA
            </p>
            <p className="text-lg font-bold">رصيد البطاقة</p>

            {/* Display Different Buttons Based on Card Status */}
            <div className="mt-6 flex flex-col items-center">
            {card.status === "Blocked" ? (
              // If the card is BLOCKED, show ONLY the "Transfer Money" button
              <button
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 shadow-md"
                onClick={() => setShowTransferModal(true)}
              >
                <HiOutlineArrowsRightLeft /> تحويل الأموال إلى بطاقة جديدة
              </button>
            ) : (
              // If the card is ACTIVE or INACTIVE, show both buttons
              <div className="flex w-full justify-center gap-4">
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 shadow-md"
                  onClick={() => handleTransaction("topUp")}
                >
                  <MdAddCard /> شحن الرصيد
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 shadow-md"
                  onClick={() => handleTransaction("purchase")}
                >
                  <IoCartOutline />  شراء
                </button>
              </div>
            )}
          </div>


        {/* Orders & Spending Section */}
        <div className="mt-10 flex justify-between w-full text-gray-700 border-t pt-4">
              <div className="w-1/2 text-center">
                <p className="text-xl font-semibold">0</p>
                <p className="text-sm text-gray-500">إجمالي الطلبات</p>
              </div>
              <div className="w-1/2 text-center">
                <p className="text-xl font-semibold">0 DA</p>
                <p className="text-sm text-gray-500">إجمالي المشتريات</p>
              </div>
              
            </div>
          </div>
        </div>


      {/* Transaction Amount Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center w-96">
            <h2 className="text-xl font-bold mb-4">
              {transactionType === "topUp" ? "إدخال مبلغ الشحن" : "إدخال مبلغ الشراء"}
            </h2>
            
            <input
              type="number"
              min="1"
              placeholder="أدخل المبلغ"
              className="border border-gray-300 px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
            />
            
            <div className="flex gap-4 mt-4">
              <button
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 shadow-md"
                onClick={processTransaction}
              >
                تأكيد
              </button>
              <button
                className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 shadow-md"
                onClick={() => setShowTransactionModal(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Confirmation Modal for Card Type Change */}
      {showTypeConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-bold mb-4">تأكيد تغيير نوع البطاقة</h2>
            <p className="mb-4">هل أنت متأكد أنك تريد تحديد هذا النوع؟ سيتم شحن الرصيد الجديد تلقائيًا.</p>

            <div className="flex gap-4 justify-center">
              <button
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 shadow-md"
                onClick={confirmCardTypeSelection}
              >
                تأكيد
              </button>
              <button
                className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 shadow-md"
                onClick={() => setShowTypeConfirmation(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


        {/* Block + Transactions History 'Active Card' Button */}
        {card.status === "Active" && (
          <div className="mt-6 flex justify-between w-full gap-5">
            {/* Block Card Button */}
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border border-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 shadow-md"
              onClick={handleBlockCard}
            >
              <FaBan /> حظر البطاقة
            </button>

            {/* Transaction History Button */}
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 shadow-md"
              onClick={fetchTransactionHistory}
            >
              <TbReportSearch /> سجل الحركات المالية
            </button>
          </div>
        )}


        {/* Block + Transactions History 'Active Card' Button */}
        {card.status === "Blocked" && (
          <div className="mt-6 flex justify-between w-full gap-5">

            {/* Transaction History Button */}
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 shadow-md"
              onClick={fetchTransactionHistory}
            >
              <TbReportSearch /> سجل الحركات المالية
            </button>
          </div>
        )}


        {showTransactionHistory && (
          <div className="mt-4 w-full bg-white p-4 border border-gray" dir="rtl">
            <h2 className="text-xl font-bold mb-4 text-center">سجل الحركات المالية</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-gray-700">التاريخ</th>
                  <th className="p-3 text-gray-700">مبلغ التحويل</th>
                  <th className="p-3 text-gray-700">المكافأة</th>
                  <th className="p-3 text-gray-700">الرصيد القديم</th>
                  <th className="p-3 text-gray-700">الرصيد الجديد</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => {
                    // Extract date and time from transaction.date
                    const [date, time] = transaction.date.split(" ");

                    return (
                      <tr key={index} className="border-b text-center">
                        <td className="p-3">
                          {date} <span className="text-gray-500">({time})</span>
                        </td>
                        <td
                          className={`p-3 font-bold ${
                            transaction.amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {Math.abs(transaction.amount)} دج
                          {transaction.amount < 0 && " -"}
                        </td>
                        <td className="p-3">{transaction.bonus} دج</td>
                        <td className="p-3 text-gray-500">{transaction.old_balance} دج</td>
                        <td className="p-3">{transaction.new_balance} دج</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-gray-500 text-center">
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}




        {/* Transfer Money Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center w-96">
              <h2 className="text-xl font-bold mb-4">إدخال الباركود الخاص بالبطاقة الجديدة</h2>
              
              <input
                type="text"
                placeholder="أدخل الباركود الجديد"
                className="border border-gray-300 px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={newCardBarcode}
                onChange={(e) => setNewCardBarcode(e.target.value)}
              />
              
              <div className="flex gap-4 mt-4">
                <button
                  className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 shadow-md"
                  onClick={handleTransferMoney}
                >
                  تأكيد
                </button>
                <button
                  className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 shadow-md"
                  onClick={() => setShowTransferModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}






      </div>
    </div>
  );
};

export default CardSearchModal;