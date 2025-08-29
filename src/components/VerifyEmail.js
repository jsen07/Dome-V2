import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import svgLogo from "./images/logo-transparent-png.png";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

function VerifyEmail() {
  const { resendVerificationEmail, currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [verify, setVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const passwordRef = useRef();

  const pendingEmail = localStorage.getItem("pendingEmail");

  const handleResend = async () => {
    if (!pendingEmail) return toast.error("No email to verify");
    if (passwordRef.current.value.length < 6)
      return toast.info("Password must be at least 6 characters.");

    try {
      const password = passwordRef.current.value;
      const userCredential = await auth.signInWithEmailAndPassword(
        pendingEmail,
        password
      );

      if (!userCredential.user.emailVerified) {
        await userCredential.user.sendEmailVerification();
        toast.success("Verification email resent!");
        setSuccessMessage(true);
      }
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(err.code);
      }
    }
  };

  return (
    <div className="flex flex-col max-h-screen text-white">
      <div className="flex py-8 justify-center">
        <img src={svgLogo} alt="Logo" className="w-64 object-contain" />
      </div>
      <div className="p-8 rounded-2xl w-full max-w-md flex flex-col items-center justify-center grow">
        <div>
          <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
          <p className="mb-6 text-neutral-400">
            We’ve sent a verification link to your email. Please check your
            inbox (and spam folder) to complete registration.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={resendVerificationEmail}
              className="shadow-lg px-4 py-2 bg-violet-600 hover:bg-violet-500 transition rounded self-start"
            >
              Resend Verification Email
            </button>
            {successMessage && (
              <span className="mb-6 font-medium text-sm text-green-600">
                Verification email has been resent.
              </span>
            )}
          </div>

          {/* {verify && (
            <div className="flex flex-col gap-2 py-4 text-sm">
              <label className="font-medium">
                Enter your password to resend verification
              </label>
              <input
                className="p-2 bg-neutral-700 text-white rounded-md w-full pr-10"
                type={showPassword ? "text" : "password"}
                ref={passwordRef}
              />

              <button
                onClick={() => {
                  handleResend();
                }}
                className="shadow-lg px-4 py-2 bg-violet-600 hover:bg-violet-500 transition rounded self-start"
              >
                {" "}
                Resend{" "}
              </button>
            </div>
          )} */}
          <button
            onClick={() => {
              setCurrentUser(null);
              navigate("/");
            }}
            className="text-white font-semibold py-2 rounded-lg my-4 flex flex-row gap-2 items-center text-sm"
          >
            <ArrowBackRoundedIcon />
            Go back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
