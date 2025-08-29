import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import svgLogo from "./images/logo-transparent-png.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import WavingHandIcon from "@mui/icons-material/WavingHand";

const Login = () => {
  const displaynameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const repeatPasswordRef = useRef();

  const { signUp, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("pendingEmail");
  }, []);

  const validateForm = () => {
    const email = emailRef.current.value.trim();
    const password = passwordRef.current.value.trim();

    if (!email || !password) {
      return "Please fill out all required fields.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!isLoginActive) {
      const displayName = displaynameRef.current.value.trim();
      const repeatPassword = repeatPasswordRef.current.value.trim();

      if (!displayName) {
        return "Display name is required.";
      }
      if (password !== repeatPassword) {
        return "Passwords do not match.";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      if (!isLoginActive) {
        await signUp(
          emailRef.current.value,
          passwordRef.current.value,
          displaynameRef.current.value
        );
      } else {
        const user = await login(
          emailRef.current.value,
          passwordRef.current.value
        );
        if (user && user.emailVerified) navigate("/home");
      }
    } catch (err) {
      toast.error("Invalid details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 bg-neutral-950 text-white w-full min-h-screen font-sourceSans3 flex flex-col justify-between px-4">
      <div className="flex py-8 justify-center">
        <img
          src={svgLogo}
          alt="Logo"
          className="w-64 object-contain animate-logoBounce"
        />
      </div>

      <div className="flex flex-col items-center grow w-full max-w-md mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col py-4 rounded-lg w-full text-sm gap-2 animate-logoBounce"
        >
          {isLoginActive ? (
            <h1 className="text-4xl font-bebas mb-2 flex gap-4">
              {" "}
              Welcome Back!{" "}
              <WavingHandIcon
                className="text-violet-300"
                style={{ fontSize: "inherit" }}
              />{" "}
            </h1>
          ) : (
            <h1 className="text-4xl font-bebas mb-2">
              {" "}
              <PersonIcon
                className="text-violet-500"
                style={{ fontSize: "inherit" }}
              />{" "}
              Create an Account{" "}
            </h1>
          )}

          {!isLoginActive && (
            <>
              <label>Display Name</label>
              <input
                className="p-2 bg-neutral-700 text-white rounded-md"
                type="text"
                ref={displaynameRef}
              />
            </>
          )}

          <label>Email</label>
          <input
            className="p-2 bg-neutral-700 text-white rounded-md"
            type="email"
            ref={emailRef}
          />

          <label>Password</label>
          <div className="relative">
            <input
              className="p-2 bg-neutral-700 text-white rounded-md w-full pr-10"
              type={showPassword ? "text" : "password"}
              ref={passwordRef}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? (
                <VisibilityOffIcon style={{ fontSize: "inherit" }} />
              ) : (
                <VisibilityIcon style={{ fontSize: "inherit" }} />
              )}
            </button>
          </div>

          {!isLoginActive && (
            <>
              <label>Repeat Password</label>
              <div className="relative">
                <input
                  className="p-2 bg-neutral-700 text-white rounded-md w-full pr-10"
                  type="password"
                  ref={repeatPasswordRef}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="shadow-lg p-2 bg-violet-600 mt-4 hover:bg-violet-500 transition rounded w-full"
          >
            {isLoginActive ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-3 text-sm animate-fadeSwitch">
          {isLoginActive ? (
            <>
              Don’t have an account?{" "}
              <span
                className="text-violet-300 underline cursor-pointer hover:text-violet-200 transition-colors"
                onClick={() => setIsLoginActive(false)}
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-violet-300 underline cursor-pointer hover:text-violet-200 transition-colors"
                onClick={() => setIsLoginActive(true)}
              >
                Login
              </span>
            </>
          )}
        </div>
      </div>

      <footer className="text-center py-6 text-gray-500 text-xxs animate-footerRise">
        Created by <span className="text-violet-400">Jayssen De Castro</span> •
        Built with React & Tailwind CSS
      </footer>
    </div>
  );
};

export default Login;
