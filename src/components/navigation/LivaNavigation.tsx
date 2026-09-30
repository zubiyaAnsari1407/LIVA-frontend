import { Bell, ChevronDown, LogOut, Menu, Search, Users, X } from "lucide-react";

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";

import "./liva-navigation.css";

const roleLinks = {
  landowner: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Land / Projects", path: "/landowner/projects" },
    { label: "My Requests", path: "/landowner/requests" },
    { label: "Tracking", path: "/landowner/tracking" },
  ],
  officer: [
    { label: "Registration Requests", path: "/dashboard" },
    { label: "Grievance Verification", path: "/officer/grievances" },
    { label: "Project Management", path: "/officer/projects" },
    { label: "Reports", path: "/reports" },
  ],
  admin: [
    { label: "Registration Approval", path: "/admin/approval" },
    { label: "Project Management", path: "/officer/projects" },
    { label: "Reports", path: "/reports" },
  ],
} as const;

const additionalRoleLinks = {
  landowner: [],
  officer: [
    { label: "Documents & Records", path: "/documents" },
    { label: "Compensation", path: "/compensation" },
    { label: "Rehabilitation & Resettlement", path: "/rehabilitation" },
    { label: "Action Centre", path: "/actions" },
  ],
  admin: [
    { label: "Documents & Records", path: "/documents" },
    { label: "Compensation", path: "/compensation" },
    { label: "Rehabilitation & Resettlement", path: "/rehabilitation" },
    { label: "Action Centre", path: "/actions" },
  ],
} as const;

export default function LivaNavigation() {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const links = role ? roleLinks[role] : roleLinks.landowner;
  const additionalLinks = role ? additionalRoleLinks[role] : additionalRoleLinks.landowner;
  const allLinks = [...links, ...additionalLinks];

  function closeMenu() {
    setMobileOpen(false);
    setMoreOpen(false);
  }

  function goToPath(path: string) {
    closeMenu();
    const [pathname, hash] = path.split("#");
    if (location.pathname === pathname && hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (location.pathname === pathname && !hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(path);
  }

  return (
    <header className="liva-navigation">
      <div className="liva-navigation-inner">

        {/* Brand */}
      <Link
  to="/dashboard"
  className="liva-navigation-brand"
  onClick={closeMenu}
  aria-label="Liva Dashboard"
>
  <span className="liva-logo-window">
    <img
      src="/images/liva-logo.png"
      alt="Liva"
    />
  </span>
</Link>
        {/* Desktop Navigation */}
        <nav
          className="liva-desktop-nav"
          aria-label="Main navigation"
        >

          {links.map((item) => (
            <button
              type="button"
              key={item.path}
              className={(location.pathname === item.path.split("#")[0] || ((item.path === "/officer/projects" || item.path === "/landowner/projects" || item.path === "/landowner/requests" || item.path === "/landowner/tracking") && location.pathname.startsWith(`${item.path}/`))) ? "liva-nav-link active" : "liva-nav-link"}
              onClick={() => goToPath(item.path)}
            >
              {item.label}
            </button>
          ))}

          {additionalLinks.length > 0 && (
            <div className="liva-nav-group">
              <button
                type="button"
                className="liva-nav-link"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                More <ChevronDown size={13} className={moreOpen ? "liva-chevron rotate" : "liva-chevron"} />
              </button>
              {moreOpen && (
                <div className="liva-dropdown">
                  {additionalLinks.map((item) => (
                    <button key={item.path} type="button" className="liva-dropdown-item" onClick={() => goToPath(item.path)}>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right actions */}
        <div className="liva-navigation-actions">

          <button
            type="button"
            className="liva-search-button"
            onClick={() => {
              // Search workspace can be connected later.
            }}
            aria-label="Search"
          >
            <Search size={17} />
            <span>
              Search projects, land, records...
            </span>
          </button>

          <button
            type="button"
            className="liva-icon-button"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          {role !== "landowner" && <button
            type="button"
            className="liva-profile-button"
            aria-label={`${role ?? "User"} account`}
            onClick={() => goToPath("/dashboard")}
          >
            <Users size={18} />
          </button>}

          {role === "landowner" && (
            <button type="button" className="liva-logout-button" onClick={() => { closeMenu(); logout(); navigate("/login", { replace: true }); }}>
              <LogOut size={16} /><span>Logout</span>
            </button>
          )}

          {/* Mobile */}
          <button
            type="button"
            className="liva-mobile-button"
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen((value) => !value)
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="liva-mobile-menu">

          <div className="liva-mobile-group">
            <div className="liva-mobile-group-title">{role === "officer" ? "Officer Workspace" : role === "admin" ? "Admin Workspace" : "Landowner Workspace"}</div>
            {allLinks.map((item) => (
              <button
                type="button"
                key={item.path}
                className={(location.pathname === item.path.split("#")[0] || ((item.path === "/officer/projects" || item.path === "/landowner/projects" || item.path === "/landowner/requests" || item.path === "/landowner/tracking") && location.pathname.startsWith(`${item.path}/`))) ? "liva-mobile-link active" : "liva-mobile-link"}
                onClick={() => goToPath(item.path)}
              >
                {item.label}
              </button>
            ))}
            {role === "landowner" && <button type="button" className="liva-mobile-link" onClick={() => { closeMenu(); logout(); navigate("/login", { replace: true }); }}>Logout</button>}
          </div>
        </div>
      )}
    </header>
  );
}
