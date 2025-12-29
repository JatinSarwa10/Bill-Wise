import React, { useCallback, useEffect, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, useUser, SignedOut, useAuth } from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();

  const navigate = useNavigate();
  const profileRef = useRef(null);
  const Token_key = "token";

  //for token generation (meaning fetch and store also refresh for token if not found)
  const fetchandStoreToken = useCallback(async () => {
    try {
      if (!getToken) {
        return null;
      }
      const token = await getToken().catch(() => null);
      if (token) {
        try {
          localStorage.setItem(Token_key, token);
          console.log(token);
        } catch (e) {
          console.log(e);
        }
        return token;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }, [getToken]);

  useEffect(() => {
    let mounted = true;

  (async () => {
        if (isSignedIn){

        const t = await fetchandStoreToken({ template: "default" }).catch(
          () => null
        );
      
        if (!t && mounted) {
          await fetchandStoreToken({ forceRefresh: true }).catch(() => null);
        }
        }
        else{
          try{
            localStorage.removeItem(Token_key);
          } catch(e){console.error(e)}
        }
    })();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, user, fetchandStoreToken]);

  //after successfull login redirect us to dashboard
  useEffect(()=>{
    if(isSignedIn){
      const pathname = window.location.pathname || "/";
      if(
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/auth") ||
        pathname === "/"
      ){
        navigate("app/dashboard",{ replace: true})
      }  
    }
  });

  // Close profile popover on outside click
useEffect(() => {
  function onDocClick(e) {
    if (!profileRef.current) return;
    if (!profileRef.current.contains(e.target)) {
      setProfileOpen(false);
    }
  }
  if (profileOpen) {
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
  }
  return () => {
    document.removeEventListener("mousedown", onDocClick);
    document.removeEventListener("touchstart", onDocClick);
  };
}, [profileOpen]);

  function openSignIn() {
    try {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn();
      } else {
        navigate("/login");
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openSignUp() {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      } else {
        navigate("/signup");
      }
    } catch (e) {
      console.error(e);
      navigate("/signup");
    }
  }

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        <nav className={navbarStyles.nav}>
          <div className={navbarStyles.logoSection}>
            <Link to="/" className={navbarStyles.logoLink}>
              <img
                src="./Logo.png"
                alt="logo"
                className={navbarStyles.logoImage}
              />
              <span className={navbarStyles.logoText}>
                <img className="h-8 w-auto" src="./logoText.png" alt="" />
              </span>
            </Link>

            <div className={navbarStyles.desktopNav}>
              <a href="#features" className={navbarStyles.navLink}>
                Features
              </a>
              <a href="#Pricing" className={navbarStyles.navLink}>
                Pricing
              </a>
            </div>
          </div>

          <div className=" flex items-center gap-4">
            <div className={navbarStyles.authSection}>
              <SignedOut>
                <button
                  onClick={openSignIn}
                  className={navbarStyles.signInButton}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className={navbarStyles.signUpButton}
                  type="button"
                >
                  <div className={navbarStyles.signUpOverlay}></div>
                  <span className={navbarStyles.signUpText}> Get Started</span>
                  <svg
                    className={navbarStyles.signUpIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </SignedOut>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
