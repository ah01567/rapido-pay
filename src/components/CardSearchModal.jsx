import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";

const CardSearchModal = ({ isOpen, onClose, card }) => {
  if (!isOpen || !card) return null;

  const [cardTypes, setCardTypes] = useState([]);
  const [selectedCardType, setSelectedCardType] = useState(card?.type || "");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState(""); 
  const [transactionAmount, setTransactionAmount] = useState("");
  



  useEffect(() => {
    if (window.api) {
      window.api.getCardTypes()
        .then((data) => {
          setCardTypes(data || []);
        })
        .catch((error) => console.error("Error fetching card types:", error));
    }
  }, []);



  // Change the type of the card
  const handleCardTypeChange = (newType) => {
    setSelectedCardType(newType);
    if (window.api) {
      window.api.updateCardType(card.barcode, newType)
        .then(() => console.log("Card type updated successfully!"))
        .catch((error) => console.error("Error updating card type:", error));
    }
  };

  

  // Handle 'Top up' OR 'Buy' based on the clicked button:
  const handleTransaction = (type) => {
    setTransactionType(type);
    setTransactionAmount(""); 
    setShowTransactionModal(true); 
  }


  // Process 'Top up' OR 'Buy' based on the clicked button:
  const processTransaction = () => {
    if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
      alert("يرجى إدخال مبلغ صالح.");
      return;
    }
  
    if (transactionType === "topUp") {
      handleTopUp(transactionAmount);
    } else if (transactionType === "purchase") {
      handlePurchase(transactionAmount);
    }
  
    setShowTransactionModal(false); // Close modal after submission
  };
  
  
  // Top up function
  const handleTopUp = (amount) => {
    window.api.topUpCard({ barcode: card.barcode, amount: parseFloat(amount) })
      .then((response) => {
        if (response.error) {
          alert("Error topping up: " + response.error);
        } else {
          alert("تم الشحن بنجاح ! الرصيد الحالي هو " + response.newBalance);
          onClose(); 
        }
      })
      .catch((error) => console.error("Error:", error));
  };
  



  // Buy function
  const handlePurchase = (amount) => {
    alert("Purchase successful!");
  };
  
  // Block Card function
  const handleBlockCard = () => {
    if (!window.confirm("هل أنت متأكد أنك تريد حظر هذه البطاقة؟")) return;
  
    window.api.blockCard(card.barcode)
      .then((response) => {
        if (response.error) {
          alert("خطأ: " + response.error);
        } else {
          alert("تم حظر البطاقة بنجاح!");
          onClose();
        }
      })
      .catch((error) => console.error("Error blocking card:", error));
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
          <div className="w-2/5 p-4 rounded-lg shadow-sm text-right">
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
                    <option value="0" selected={card.type === 0}>
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
          <div className="w-3/5 p-4 rounded-lg shadow-sm text-center border border-black">
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
                // onClick={handleTransferToNewCard} // Define this function if needed
              >
                🔄 تحويل الأموال إلى بطاقة جديدة
              </button>
            ) : (
              // If the card is ACTIVE or INACTIVE, show both buttons
              <div className="flex w-full justify-center gap-4">
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 shadow-md"
                  onClick={() => handleTransaction("topUp")}
                >
                  ⟲ شحن الرصيد
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 shadow-md"
                  onClick={() => handleTransaction("purchase")}
                >
                  🛒 شراء
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
                <p className="text-sm text-gray-500">إجمالي المصروفات</p>
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



        {/* Block 'Active Card' Button */}
        {card.status === "Active" && (
          <button
          className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 shadow-md"
          style={{width:'40%', variant:'outlined' }}
          onClick={handleBlockCard}
          >
            حظر البطاقة
          </button>
        )}




      </div>
    </div>
  );
};

export default CardSearchModal;