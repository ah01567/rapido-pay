import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import SidebarNav from "../components/Sidebar";
import API_BASE_URL from "../utils/apiBase";


const StoreMembers = () => {

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'user'
  });


  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await window.api.getAccounts();
        
        if (!data.error) {
          setMembers(data);
        } else {
          console.error("Error fetching members:", data.error);
        }        
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMembers();
  }, []);
  
  

  const handleAddMember = async () => {
    try {
      // Validate inputs
      if (!newMember.name || !newMember.phone || !newMember.password) {
        alert("الرجاء إدخال جميع الحقول المطلوبة");
        return;
      }
  
      const result = await window.api.addMember(newMember);
      
      if (result.success) {
        setMembers([...members, result.member]);
        
        // Reset form and close modal
        setIsModalOpen(false);
        setNewMember({
          name: '',
          phone: '',
          password: '',
          role: 'user'
        });
        
        alert("تمت إضافة العضو بنجاح");
      } else {
        alert(result.error || "حدث خطأ أثناء الإضافة");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("حدث خطأ غير متوقع");
    }
  };
  
  

  
  const handleDeleteMember = async (id) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا العضو؟")) return;
  
    try {
      const result = await window.api.deleteMember(id);
      
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      
        alert("تم حذف العضو بنجاح");
      } else {
        alert(result.error || "حدث خطأ أثناء الحذف");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("فشل في حذف العضو");
    }
  };
  

  


  return (
    <div className="flex flex-row-reverse h-screen bg-gray-100">
      {/* Sidebar - fixed width */}
      <SidebarNav />
      
      {/* Main content area - takes remaining space */}
      <main className="flex-1 overflow-auto p-6" dir="rtl">
        <div className="max-w-6xl mx-auto"> {/* Centered container with max width */}
          {/* Logo */}
          <h1 className="text-5xl text-center font-bold mb-6" style={{ fontFamily: "'Allura', cursive" }}>
            Rapido Pay
          </h1>

          {/* Header Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-right">
              <h1 className="text-2xl font-bold">مرحبًا بك في الصفحة الخاصة بأعضاء المتجر</h1>
              <p className="text-gray-500">
                يمكنك من خلال هذه الصفحة عرض وإدارة أعضاء متجرك من خلال العرض٬ الإضافة و الحذف!
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            

            {/* Add Member Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center mb-4 gap-2"
            >
              <FaPlus /> إضافة عضو جديد
            </button>


            {loading ? (
              <p className="text-center">جاري التحميل...</p>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
            <table className="w-full text-right">
            <thead>
              <tr className="border-b">
                <th className="p-3">الاسم</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">الدور</th>
                <th className="p-3">تاريخ التسجيل</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{member.name}</td>
                  <td className="p-3">{member.phone}</td>
                  <td className="p-3">{member.role}</td>
                  <td className="p-3">{new Date(member.creation_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Member Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center mr-64 z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl text-center font-bold mb-4 text-right">إضافة عضو جديد</h2>
              
              <div className="space-y-4">
                <div className="text-right">
                  <label className="block text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full p-2 border rounded text-right"
                  />
                </div>
                
                <div className="text-right">
                  <label className="block text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    className="w-full p-2 border rounded text-right"
                  />
                </div>
                
                <div className="text-right">
                  <label className="block text-gray-700 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                    className="w-full p-2 border rounded text-right"
                  />
                </div>
                
                <div className="text-right">
                  <label className="block text-gray-700 mb-1">الدور</label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full p-2 border rounded text-right"
                  >
                    <option value="user">مستخدم</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddMember}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreMembers;