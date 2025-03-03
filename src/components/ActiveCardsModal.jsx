import React from "react";
import { FaSpinner } from "react-icons/fa"; 
import Barcode from "react-barcode";

const ActiveCardsModal = ({ isOpen, onClose, loading, activeCards }) => {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-overlay" 
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
        style={{ width: "60%", height: "60%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Show Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <FaSpinner className="animate-spin text-gray-700 text-5xl" />
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-lg font-bold mb-4 text-center">البطاقات النشطة</h2>
            
            {/* Display Active Cards as Boxes */}
            <div className="w-full h-full flex flex-col justify-center items-center">
            {activeCards.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                {activeCards.map((card, index) => (
                    <div key={index} className="border border-gray-300 p-4 rounded-lg shadow-md text-center">
                    <div className="mb-3">
                        <Barcode value={card.barcode} format="UPC" width={1.5} height={40} style={{}}/>
                    </div>
                    <p className="text-sm text-gray-600 mb-3"><b>{card.barcode}</b></p>
                    <p className="text-sm text-gray-600">{card.credit} DA</p>
                    <p className="text-sm text-gray-600">تاريخ الإنشاء: {card.creation_date.split(" ")[0]}</p>
                    <p 
                        className={`flex items-center justify-center px-3 py-1 mt-2 rounded-lg text-sm font-semibold ${
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
                    </div>
                ))}
                </div>
            ) : (
                <div className="flex justify-center items-center h-full w-full">
                <p className="text-gray-500 text-lg text-center">لا توجد أي بطاقات نشطة</p>
                </div>
            )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCardsModal;