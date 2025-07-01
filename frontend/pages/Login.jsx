import styles from "./Login.module.css";
import login_hero from "../public/login_hero.jpg";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PacmanLoader } from "react-spinners";

const LogIn = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const signup = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: `${formData.firstName}_${formData.lastName}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Signup successful!");
        setIsLogin(true); // switch to login mode
      } else {
        alert(`Signup failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed due to network/server error.");
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3000/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `${formData.email}`,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        console.log("Login successful!");
        navigate("/home");
      } else {
        alert(`Login failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed due to network/server error.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      login();
    } else {
      signup();
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    });
  };

  return (
    <section className={styles.container}>
      <div className={styles.companyName}>Company Name</div>
      <img className={styles.img} src={login_hero} alt="LogIn Hero" />
      <div className={styles.box}>
        <div className={styles.toggleContainer}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isLogin ? styles.active : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isLogin ? styles.active : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <div className={styles.formContainer}>
          <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p>
            {isLogin
              ? "Log in to continue to your account"
              : "Sign up to get started with us"}
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.nameRow}>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className={styles.inputGroup}>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className={styles.forgotPassword}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              {isLogin ? "Log In" : "Create Account"}
            </button>
          </form>

          <p className={styles.switchMode}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleAuthMode}>
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#000d11",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <PacmanLoader
            color={"#f7f7f7"}
            loading={isLoading}
            size={25}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
    </section>
  );
};

export default LogIn;
