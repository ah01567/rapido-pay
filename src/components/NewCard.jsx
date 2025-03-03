import { useState, useEffect } from "react";

const NewCard = () => {
  const [quantity, setQuantity] = useState(1);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    console.log("🧐 Checking if window.api is available:", window.api);
    if (window.api && window.api.createMultipleCards) {
      setIsApiAvailable(true);
      console.log("window.api is available!");
    } else {
      console.error("window.api is NOT available!");
    }
  }, []);

  const handleCreateCards = () => {
    if (quantity < 1) {
      alert("يجب إدخال رقم صحيح!");
      return;
    }

    if (!isApiAvailable) {
      alert("خطأ: `window.api` غير متاح! تأكد من أن `preload.js` يعمل بشكل صحيح.");
      return;
    }

    window.api.createMultipleCards(quantity).then(() => {
      alert(`${quantity} بطاقة جديدة تم إنشاؤها بنجاح!`);
      setQuantity(1);
    }).catch((error) => {
      console.error("فشل إنشاء البطاقات:", error);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex gap-10 mt-10 ml-4">
        <div className="relative w-96 h-48 bg-gradient-to-r from-[#254636] to-[#3a5a47] rounded-xl text-white p-6 shadow-lg">
          <div className="absolute top-3 left-4 text-xl font-bold">Rapido Pay</div>
          <div className="absolute bottom-6 left-4 text-xl tracking-widest">**** **** **** ****</div>
          <div className="absolute bottom-3 left-4 text-sm">CARDHOLDER NAME</div>
          <div className="absolute bottom-3 right-4 text-sm">12/24</div>
        </div>

        {/* Payment Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4">إنشاء بطاقات دفع جديدة</h2>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                dir="rtl"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-center mt-4">
              <button
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600"
                onClick={handleCreateCards}
              >
                إصدار البطاقات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCard;