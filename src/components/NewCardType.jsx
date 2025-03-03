import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";

const NewCardType = ({ id, cardTitle, cardPrice, cardCredit, onDelete}) => {


  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col items-center relative h-auto">

      {/* 3-dot Menu Icon */}
      <div className="absolute top-3 right-3 cursor-pointer">
        <FaTrash className='text-red-600' onClick={() => onDelete(id)}/>
      </div>

      
      <div style={{marginBottom: '10px', fontWeight: 'bold'}}> <h3> {cardTitle} </h3></div>
      
      {/* Card Image */}
      <div className="relative w-11/12 h-40 bg-gradient-to-r from-[#254636] to-[#3a5a47] rounded-xl text-white p-6 shadow-lg mb-10">
        <div className="absolute top-3 left-4 text-xl font-bold">Rapido Pay</div>
        <div className="absolute bottom-3 left-4 text-sm">{cardPrice} DA</div>
      </div>

      {/* Input Fields */}
      <div className="w-full mt-4">
        {/* Name of the Card Input */}
        <label className="block text-gray-700 font-semibold mb-2 text-right" dir="rtl">
          سعر البطاقة
        </label>
        <div className="relative w-full">
          <input
            type="text"
            placeholder={cardPrice}
            className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-lg shadow-sm focus:outline-none text-right"
            dir="rtl"
            disabled
          />
          {/* Currency Label "دج" */}
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">
            دج
          </span>
        </div>

        {/* Card Credit Input */}
        <label className="block text-gray-700 font-semibold mt-4 mb-2 text-right" dir="rtl">
          رصيد البطاقة
        </label>
        <div className="relative w-full">
          <input
            type="text"
            placeholder={cardCredit}
            className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-lg shadow-sm focus:outline-none text-right"
            dir="rtl"
            disabled
          />
          {/* Currency Label "دج" */}
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">
            دج
          </span>
        </div>

      </div>
    </div>
  );
};

export default NewCardType;