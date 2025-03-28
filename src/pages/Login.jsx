import { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; 

const Login = () => {
  const navigate = useNavigate(); 

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!phone || !password) {
      alert("يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }

    try {
      const result = await window.api.loginUser({ phone, password });

      if (result.success) {
        localStorage.setItem("user_role", result.user.role);
        localStorage.setItem("user_name", result.user.name);
      
        if (result.user.role === "admin") {
          navigate("/home");
        } else {
          navigate("/cashier");
        }
      } else {
        alert(result.error || "فشل تسجيل الدخول");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: "#c5ced4" }}>
      <div className="p-8 rounded-lg shadow-lg flex w-[700px]" style={{ backgroundColor: "#f7f7f7" }}>
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="https://p.turbosquid.com/ts-thumb/nB/zeTF3J/PM/visasignaturecreditcardmb3dmodel000/jpg/1679448764/300x300/sharp_fit_q85/35a08f555bebee6ca62e49949fd3821e89035b1f/visasignaturecreditcardmb3dmodel000.jpg"
            alt="Login Illustration"
            className="w-72 h-42"
          />
        </div>

        <div className="w-1/2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center" style={{ fontSize: "30px" }}>
            تسجيل الدخول
          </h2>

          {/* phone Input */}
          <div className="mb-4">
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <FaEnvelope className="text-gray-500 mr-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=" رقم الهاتف"
                className="bg-transparent outline-none w-full"
                dir="rtl"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <FaLock className="text-gray-500 mr-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="bg-transparent outline-none w-full"
                dir="rtl"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
            onClick={handleLogin}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
