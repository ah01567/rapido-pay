import { useState } from "react";
import { FaShoppingCart, FaSyncAlt } from "react-icons/fa";

const TopUpPage = () => {
  const [balance, setBalance] = useState(2000);
  const totalOrders = 5;
  const totalSpent = 67.5;

  const handleTopUp = () => {
    const amount = prompt("Enter amount to top up:");
    if (amount && !isNaN(amount)) {
      setBalance(balance + parseFloat(amount));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white-100 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 text-gray-600">
        <FaShoppingCart className="text-xl" />
        <span className="font-medium">I am Buyer</span>
      </div>

      {/* Card Container */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6 w-full max-w-md text-center">
        <h2 className="text-gray-700 text-2xl font-semibold">US$ {balance.toFixed(2)}</h2>
        <p className="text-gray-500 text-sm">Account Balance</p>

        {/* Top Up Button */}
        <button
          onClick={handleTopUp}
          className="mt-4 flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition border-transparent"
        >
          <FaSyncAlt className="mr-2" />
          Top Up Account Balance
        </button>
      </div>

      {/* Orders & Spending */}
      <div className="mt-6 text-center">
        <p className="text-gray-700 text-lg">{totalOrders}</p>
        <p className="text-gray-500 text-sm">Total Orders</p>
        <p className="text-gray-700 text-lg mt-2">US$ {totalSpent.toFixed(2)}</p>
        <p className="text-gray-500 text-sm">Total Spent</p>
      </div>
    </div>
  );
};

export default TopUpPage;
