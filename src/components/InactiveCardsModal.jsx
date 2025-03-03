import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { FaDownload } from "react-icons/fa"; 
import jsPDF from "jspdf";
import Barcode from "react-barcode";

const InactiveCardsModal = ({ isOpen, onClose, loading, barcodes }) => {
  const [openAccordion, setOpenAccordion] = useState(null);


  const saveBarcodesAsPDF = (date, barcodeList) => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text(`Barcodes for ${date.split(" ")[0]}`, 20, 20);
  
    let yPosition = 30;
    barcodeList.forEach((barcode, index) => {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, barcode, { format: "UPC", width: 1.5, height: 40 });
      const barcodeDataURL = canvas.toDataURL("image/png");
  
      pdf.addImage(barcodeDataURL, "PNG", 20, yPosition, 80, 20);
      pdf.text(barcode, 20, yPosition + 25);
      yPosition += 40;
  
      if (yPosition > 250) {  
        pdf.addPage();
        yPosition = 30;
      }
    });
  
    pdf.save(`barcodes-${date.split(" ")[0]}.pdf`);
  };



  if (!isOpen) return null;

  return (
    <div 
      id="modal-overlay" 
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
        style={{ width: "60%", height: "70%", overflowY: "auto" }} 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-center">البطاقات غير النشطة</h2>

        {/* Spinner while fetching */}
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <FaSpinner className="animate-spin text-gray-700 text-5xl" />
          </div>
        ) : (
          <div className="w-full">
            {Object.keys(barcodes).length > 0 ? (
              Object.entries(barcodes).map(([date, barcodeList]) => (
                <div key={date} className="mb-4 border rounded-lg">
                  {/* Accordion Header */}
                  <button 
                    className="w-full flex flex-row-reverse justify-between items-center px-4 py-2 bg-gray-100 font-semibold"
                    onClick={() => setOpenAccordion(openAccordion === date ? null : date)}
                  >
                    <span className="text-right">{date.split(" ")[0]}</span> 
                    <div className="flex items-center">
                      <span>{openAccordion === date ? "▲" : "▼"}</span>
                      <FaDownload 
                        className="ml-3 text-gray-600 cursor-pointer hover:text-gray-900" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          saveBarcodesAsPDF(date, barcodeList);
                        }}
                      />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {openAccordion === date && (
                    <div className="p-3 border-t">
                      <ul className="grid grid-cols-2 gap-3">
                        {barcodeList.map((barcode, index) => (
                          <li key={index} className="p-2 border bg-gray-50 text-center flex flex-col items-center">
                            <Barcode value={barcode} format="UPC" width={1.5} height={50} />
                            <span className="text-sm mt-2">{barcode}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">لا توجد بطاقات غير نشطة</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InactiveCardsModal;
