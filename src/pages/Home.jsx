import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa"; 
import NewCard from "../components/NewCard";
import SidebarNav from "../components/Sidebar";
import InactiveCardsModal from "../components/InactiveCardsModal"; 
import CardSearchModal from "../components/CardSearchModal";
import ActiveCardsModal from "../components/ActiveCardsModal";
import LostCardsModal from "../components/LostCardsModal"; 

const Home = () => {

  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [activeCards, setActiveCards] = useState([]);
  const [lostCards, setLostCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [barcodes, setBarcodes] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchedCard, setSearchedCard] = useState(null); 
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [report, setReport] = useState({
    total_cards: 0,
    total_active_cards: 0,
    total_inactive_cards: 0,
    total_lost: 0,
  });


  // Fetch report data when the component loads
  useEffect(() => {
    if (window.api) {
      window.api.getTodayReport()
        .then((data) => {
          if (data && !data.error) {
            setReport(data);  
          } else {
            console.error("Error fetching report:", data.error);
          }
        })
        .catch((error) => console.error("Failed to fetch report:", error));
    }
  }, []);
  


  // Fetch inactive cards and open modal
  const fetchInactiveCards = () => {
    setLoading(true);
    setModalOpen(true);
  
    if (window.api) {
      window.api.getInactiveCardsGroupedByDate()
        .then((data) => {
          setBarcodes(data || {}); 
        })
        .catch((error) => console.error("Error fetching inactive cards:", error))
        .finally(() => {
          setLoading(false);
        });
    }
  };


  
  // Fetch active cards and open modal
  const fetchActiveCards = () => {
    setLoading(true);
    setActiveModalOpen(true);

    if (window.api) {
      window.api.getActiveCards() 
        .then((data) => {
          setActiveCards(data || []); 
        })
        .catch((error) => console.error("Error fetching active cards:", error))
        .finally(() => {
          setLoading(false);
        });
    }
  };


  // Fetch lost (blocked) cards and open modal
  const fetchLostCards = () => {
    setLoading(true);
    setLostModalOpen(true);
  
    if (window.api) {
      window.api.getLostCards()
        .then((data) => setLostCards(data || [])) 
        .catch((error) => console.error("Error fetching lost cards:", error))
        .finally(() => setLoading(false));
    }
  };
  


  // Fetch all cards and open modal
  const fetchAllCards = () => {
    setLoading(true);
    setModalOpen(true);
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


  return (
    <div>
      <SidebarNav />
      <div className="w-full flex flex-col justify-center items-center text-center p-6">
        {/* Logo */}
        <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: "'Allura', cursive" }}>
          Rapido Pay
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-md">
          <label className="block text-gray-700 text-lg mb-2">
            ! ابحث عن البطاقة عن طريق المسح أو إدخال رقم الكود
          </label>

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

        {/* Ticket Section */}
        <div className="w-full flex justify-center gap-6 mt-8">

        <div onClick={fetchAllCards} className="cursor-pointer bg-white p-4 rounded-l shadow-md w-48 text-center border border-gray-300">
            <p className="text-2xl font-semibold text-green-700" style={{fontSize: '30px'}}>{report.total_cards}</p>
            <h3 className="text-lg font-bold  text-gray-700 mt-4" style={{fontSize: '20px'}}>إجمالي البطاقات</h3>
          </div>

          <div onClick={fetchLostCards} className="cursor-pointer bg-white p-4 rounded-l shadow-md w-48 text-center border border-gray-300">
            <p className="text-2xl font-semibold" style={{fontSize: '30px'}}>{report.total_lost}</p>
            <h3 className="text-lg text-gray-700 mt-4" style={{fontSize: '20px'}}> البطاقات المفقودة</h3>
          </div>

          {/* Ticket Cards */}
          <div onClick={fetchActiveCards} className="cursor-pointer bg-white p-4 rounded-l shadow-md w-48 text-center border border-gray-300">
            <p className="text-2xl font-semibold" style={{fontSize: '30px'}}>{report.total_active_cards}</p>
            <h3 className="text-lg text-gray-700 mt-4" style={{fontSize: '20px'}}> البطاقات النشطة</h3>
          </div>

          <div onClick={fetchInactiveCards} className="cursor-pointer bg-white p-4 rounded-l shadow-md w-48 text-center border border-gray-300">
            <p className="text-2xl font-semibold" style={{fontSize: '30px'}}>{report.total_inactive_cards}</p>
            <h3 className="text-lg text-gray-700 mt-4" style={{fontSize: '20px'}}> البطاقات غير النشطة</h3>
          </div>

        </div>

          {/* Inactive Cards */}
          <InactiveCardsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} loading={loading} barcodes={barcodes} />

          {/* Active Cards Modal */}
          <ActiveCardsModal isOpen={activeModalOpen} onClose={() => setActiveModalOpen(false)} loading={loading} activeCards={activeCards} />


          {/* Lost Cards Modal */}
          <LostCardsModal isOpen={lostModalOpen} onClose={() => setLostModalOpen(false)} loading={loading} lostCards={lostCards} />


          {/* Modal for barcode search results */}
          <CardSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} card={searchedCard} />


          {/* Display NewCard Component */}
          <div> 
            <NewCard /> 
          </div>
      </div>
    </div>
  );
};

export default Home;