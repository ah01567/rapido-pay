import { FaWallet } from "react-icons/fa";
import { FaSackDollar } from "react-icons/fa6";
import { FaFileUpload } from "react-icons/fa";
import { GrTransaction } from "react-icons/gr";
import { BarChart as MuiBarChart } from "@mui/x-charts";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import SidebarNav from "../components/Sidebar";


const Analytics = () => {

  const data = [
    { day: "الأحد", purchase: 10000 },
    { day: "الإثنين", purchase: 20000 },
    { day: "الثلاثاء", purchase: 15000 },
    { day: "الأربعاء", purchase: 30000 },
    { day: "الخميس", purchase: 25000 },
    { day: "الجمعة", purchase: 40000 },
    { day: "السبت", purchase: 35000 },
  ];

  const cardData = [
    { name: "Card 1000DA", value: 120 },
    { name: "Card 5000DA", value: 80 },
    { name: "Card 10,000DA", value: 60 },
  ];

  const COLORS = ["#309faa", "#e04479", "#a2b71f"];

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
          <h1 className="text-2xl font-bold"> مرحبًا بك في صفحة التحليلات البيانية</h1>
          <p className="text-gray-500" dir="rtl">عرض تحليلات البيانات الخاصة بك</p>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <GrTransaction className="text-blue-500 text-2xl" />
          <h3 className="text-lg font-semibold mt-2">متوسط ​​المعاملات اليومية</h3>
          <p className="text-2xl font-bold">9</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <FaFileUpload className="text-yellow-500 text-2xl" />
          <h3 className="text-lg font-semibold mt-2">متوسط ​​مبلغ التعبئة </h3>
          <p className="text-2xl font-bold">2000 DA</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <FaWallet className="text-red-500 text-2xl" />
          <h3 className="text-lg font-semibold mt-2">إجمالي المشتريات</h3>
          <p className="text-2xl font-bold">80,000 DA</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <FaSackDollar className="text-green-500 text-2xl" />
          <h3 className="text-lg font-semibold mt-2">إجمالي الدخل</h3>
          <p className="text-2xl font-bold"> 100,000 DA</p>
        </div>
      </div>

        {/* Funds and Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Funds Card (Pie Chart) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center" style={{fontSize: '25px'}}>
              احصائيات بطاقات المتجر
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cardData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                >
                  {cardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center">تحليل المشتريات حسب الأيام</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="day" label={{ value: "اليوم", position: "insideBottom", offset: -5 }} />
                <Tooltip formatter={(value) => `${value} DA`} />
                <Bar dataKey="purchase" fill="#82ca9d" name="المشتريات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
    </div>
    </div>
  );
};

export default Analytics;
