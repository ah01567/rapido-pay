import { useState, useEffect } from "react";
import SidebarNav from "../components/Sidebar";
import NewCardType from "../components/NewCardType";

const CardTypes = () => {
  const [cards, setCards] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardPrice, setCardPrice] = useState("");
  const [cardCredit, setCardCredit] = useState("");


  
  useEffect(() => {
    window.api
      .getCardTypes()
      .then((savedCards) => {
        if (savedCards && savedCards.length > 0) {
          setCards(savedCards);
        }
      })
      .catch((error) => {
        console.error("Error fetching card types:", error);
      });
  }, []);

  

  // Open Modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCardPrice("");
    setCardCredit("");
  };

  // Save New Card
const handleSaveCard = async () => {
  if (!cardPrice || !cardCredit) {
    alert("يجب إدخال جميع الحقول!");
    return;
  }

  try {
    console.log(" Sending request to save card...", { cardPrice, cardCredit });

    // Invoke the Electron IPC method
    const response = await window.electron.ipcRenderer.invoke("save-card-type", {
      cardPrice,
      cardCredit,
    });

    if (response.success) {
      console.log("Card saved with ID:", response.insertedId);

      setCards((prevCards) => [
        ...prevCards,
        {
          id: response.insertedId,
          cardTitle: `بطاقة ${cardPrice} دج`,
          cardPrice: cardPrice,
          cardCredit: cardCredit,
        }
      ]);
      

      handleCloseModal();
    } else {
      console.error("🚨 Failed to save card:", response.error);
      alert("حدث خطأ أثناء حفظ البطاقة!");
    }
  } catch (error) {
    console.error("🚨 Error saving card:", error);
    alert("حدث خطأ أثناء حفظ البطاقة!");
  }
};

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (cardId) => {
    setSelectedCardId(cardId);
    setIsDeleteModalOpen(true);
  };

  // Close Delete Confirmation Modal
  const handleCloseDeleteModal = () => {
    setSelectedCardId(null);
    setIsDeleteModalOpen(false);
  };

  // Delete Card
  const handleDeleteCard = async () => {
    if (!selectedCardId) return;
  
    try {
      console.log("🗑 Sending request to delete card type...", selectedCardId);
  
      // Invoke Electron IPC method
      const response = await window.electron.ipcRenderer.invoke("delete-card-type", selectedCardId);
  
      if (response.success) {
        console.log("Card type deleted successfully!");
  
        // Update state to remove the deleted card type from UI
        setCards((prevCards) => prevCards.filter((card) => card.id !== selectedCardId));
  
        handleCloseDeleteModal(); // Close delete confirmation modal
      } else {
        console.error("Failed to delete card type:", response.error);
        alert("حدث خطأ أثناء حذف البطاقة!");
      }
    } catch (error) {
      console.error("Error deleting card type:", error);
      alert("حدث خطأ أثناء حذف البطاقة!");
    }
  };  


  return (
    <div>
      <SidebarNav />
      <div className="p-6 bg-gray-100 min-h-screen">
      
        {/* Logo */}
        <h1 className="text-5xl flex flex-col justify-center items-center text-center font-bold mb-6" style={{ fontFamily: "'Allura', cursive" }}>
          Rapido Pay
        </h1>

        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-end items-center">
          <div>
            <h1 className="text-2xl font-bold" dir='rtl'>مرحبًا بك في الصفحة الخاصة ببطاقات المتجر</h1>
            <p className="text-gray-500" dir="rtl">يمكنك من خلال هذه الصفحة عرض و انشاء أنواع بطاقات الدفع الخاصة بمتجرك!</p>
          </div>
        </div>

        {/* Add New Card Button */}
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleOpenModal}
            className="w-80 py-4 text-lg font-semibold rounded-full shadow-md hover:bg-indigo-700 transition"
            style={{ backgroundColor: 'white', border: '1px solid rgb(0, 0, 0)' }}
          >
            إنشاء بطاقة جديدة
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50" onClick={handleCloseModal} >
            <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}  >
              <h2 className="text-xl font-bold mb-4 text-center">إضافة بطاقة جديدة</h2>

              {/* Card Price Input */}
              <label className="block text-gray-700 font-semibold mb-2 text-right" dir="rtl">
                سعر البطاقة
              </label>
              <input
                type="number"
                placeholder="أدخل سعر البطاقة"
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg shadow-sm focus:outline-none text-right"
                dir="rtl"
              />

              {/* Card Credit Input */}
              <label className="block text-gray-700 font-semibold mt-4 mb-2 text-right" dir="rtl">
                رصيد البطاقة
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  placeholder="أدخل رصيد البطاقة"
                  value={cardCredit}
                  onChange={(e) => setCardCredit(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-lg shadow-sm focus:outline-none text-right"
                  dir="rtl"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">
                  دج
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-6 gap-4">
                <button 
                  onClick={handleCloseModal}
                  className="w-1/2 py-3 bg-white  font-semibold rounded-lg shadow-md hover:bg-gray-100"
                  style={{border: '1px solid  #3182ce', color: ' #3182ce'}}
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSaveCard}
                  className="w-1/2 py-3 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
                  style={{border: '1px solid blue', backgroundColor: ' #3182ce'}}
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 mr-64 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h2 className="text-xl font-bold mb-4">هل أنت متأكد أنك تريد حذف هذه البطاقة؟</h2>
              
              {/* Buttons */}
              <div className="flex justify-between mt-6 gap-4">
                <button 
                  onClick={handleCloseDeleteModal}
                  className="w-1/2 py-3 bg-white font-semibold rounded-lg shadow-md hover:bg-gray-100"
                  style={{ border: '1px solid #3182ce', color: '#3182ce' }}
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleDeleteCard}
                  className="w-1/2 py-3 text-white font-semibold bg-red-700 rounded-lg shadow-md hover:bg-red-700"
                  style={{ border: '1px solid red' }}
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Card Box Section */}
        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          {cards.map((card) => (
            <NewCardType
              key={card.id}
              id={card.id}
              cardTitle={card.cardTitle}
              cardPrice={`${card.cardPrice}`}
              cardCredit={`${card.cardCredit}`} 
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardTypes;