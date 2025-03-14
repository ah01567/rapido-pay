import React from "react";
import { FaSpinner } from "react-icons/fa";
import Barcode from "react-barcode";
import { FaLock } from "react-icons/fa";

const LostCardsModal = ({ isOpen, onClose, loading, lostCards }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
        style={{ width: "60%", height: "60%", overflowY: "auto" }} 
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <FaSpinner className="animate-spin text-gray-700 text-5xl" />
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-lg font-bold mb-4 text-center">البطاقات المفقودة</h2>
            {lostCards.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 text-center">
                {lostCards.map((card, index) => (
                  <li key={index} className="border p-4 rounded-lg shadow-md">
                    <div className="flex justify-center items-center">
                      <Barcode value={card.barcode} format="UPC" width={1.5} height={50} />
                    </div>
                    <p className="text-sm text-gray-600"> <b> {card.barcode} </b></p>
                    <p className="text-sm text-gray-600"> {card.credit} DA</p>
                    <p className="text-sm text-gray-600">تاريخ الإنشاء: {card.creation_date.split(" ")[0]}</p>
                    <p 
                        className={`flex items-center justify-center px-3 py-1 mt-2 rounded-lg text-sm font-semibold ${
                            card.status === "Blocked"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-green-100 text-green-600"
                        }`}
                    >
                        <FaLock className="mr-2 text-gray-800" /> {/* Lock icon */}
                        {card.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center  w-full">
                <p className="text-gray-500 text-lg text-center">لا توجد بطاقات مفقودة</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostCardsModal;
