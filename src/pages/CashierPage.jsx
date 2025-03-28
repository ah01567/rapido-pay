import { useState } from "react";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import CashierCardSearchModal from "../components/CashierCardSearchModal";
import { useNavigate } from "react-router-dom";
import { CiLogout } from "react-icons/ci";

const CashierPage = () => {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchedCard, setSearchedCard] = useState(null); 
  const [searchModalOpen, setSearchModalOpen] = useState(false);


  const handleRefresh = () => {
    setBarcodeInput(""); 
    window.location.reload(); 
  };
  

  // Handle search by barcode
  const handleSearch = () => {
    if (!barcodeInput.trim()) return;

    setLoading(true);
    setSearchedCard(null);

    if (window.api) {
      window.api.searchCardByBarcode(barcodeInput)
        .then((data) => {
          if (data && !data.error) {
            setSearchedCard(data);
            setSearchModalOpen(true); 
          } else {
            console.error("Error fetching card:", data.error);
            setSearchedCard(null);
          }
        })
        .catch((error) => console.error("Failed to fetch card:", error))
        .finally(() => {
          setLoading(false);
        });
    }
  };


  const handleLogout = () => {
    localStorage.clear(); 
    navigate("/login");   
  };

  
  return (
    <div className="mr-10 mt-20">

      {/* Logout Button (Top-left) */}
      <div className="absolute top-4 left-3">
        < CiLogout onClick={handleLogout} size={25} className="text-gray-600 hover:text-red-600 cursor-pointer"/>
      </div>

      <div className="w-full flex flex-col justify-center items-center text-center p-6 ">
        {/* Logo */}
        <h1 className="text-8xl mb-6" style={{ fontFamily: "'Allura', cursive" }}>
          Rapido Pay
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-3xl">
          <label className="block text-gray-700 text-2xl  mb-4">
            ! ابحث عن البطاقة عن طريق المسح أو إدخال رقم الكود
          </label>

          {/* Flex container for Search and Refresh */}
          <div className="flex items-center gap-3">
            {/* Refresh Button (Outside the Input) */}
            <button
              onClick={handleRefresh}
              className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              <FaSyncAlt size={18} className="text-gray-700" />
            </button>

            {/* Search Input with Icon */}
            <div className="relative flex items-center w-full">
              {/* Search Icon (Clickable) */}
              <div className="absolute left-3 text-gray-500 hover:text-gray-700" onClick={handleSearch}>
                <FaSearch size={18} />
              </div>

              {/* Input Field */}
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="أدخل رقم البطاقة هنا..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right placeholder-right"
                dir="rtl"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          {/* Modal for barcode search results */}
          <CashierCardSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} card={searchedCard} />

        </div>
      </div>
    </div>
  );
};

export default CashierPage;