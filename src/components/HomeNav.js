import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonIcon from "@mui/icons-material/Person";
import ForumIcon from "@mui/icons-material/Forum";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";

const HomeNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // alert("You've been logged out");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getActiveLink = () => {
    if (location.pathname.startsWith("/home")) return "home";
    if (location.pathname.startsWith("/chats")) return "chats";
    if (location.pathname.startsWith("/profile")) return "profile";
    if (location.pathname.startsWith("/post-upload")) return "post";
    return "";
  };

  const activeLink = getActiveLink();

  const navItems = [
    {
      id: "home",
      icon: HomeIcon,
      outlinedIcon: HomeOutlinedIcon,
      onClick: () => navigate("/home"),
    },
    {
      id: "profile",
      icon: PersonIcon,
      outlinedIcon: PersonOutlineOutlinedIcon,
      onClick: () => navigate(`/profile?userId=${currentUser.uid}`),
    },
    {
      id: "post",
      icon: AddBoxRoundedIcon,
      outlinedIcon: AddBoxOutlinedIcon,
      onClick: () => navigate(`/post-upload?userId=${currentUser.uid}`),
    },
    {
      id: "chats",
      icon: ForumIcon,
      outlinedIcon: ForumOutlinedIcon,
      onClick: () => navigate("/chats"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-neutral-950 h-20 z-10 py-3 border-t border-neutral-900">
      <div className="flex justify-evenly items-center">
        {navItems.map(
          ({ id, icon: ActiveIcon, outlinedIcon: InactiveIcon, onClick }) => (
            <button
              key={id}
              onClick={onClick}
              className="flex flex-col items-center text-2xl text-neutral-600 size-10 justify-center"
            >
              {activeLink === id ? (
                <ActiveIcon
                  className="text-violet-500"
                  style={{ fontSize: "inherit" }}
                />
              ) : (
                <InactiveIcon style={{ fontSize: "inherit" }} />
              )}
            </button>
          )
        )}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-2xl text-neutral-600 size-10 justify-center"
          aria-label="Logout"
        >
          <ExitToAppIcon style={{ fontSize: "inherit" }} />
        </button>
      </div>
    </nav>
  );
};

export default HomeNav;
