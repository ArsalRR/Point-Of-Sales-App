import { Home, Package, BadgeDollarSign } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import LaporanMenu from "./LaporanMenu"

function useBottomNavScroll() {
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const THRESHOLD = 8

    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const diff = currentScrollY - lastScrollY.current

        if (diff > THRESHOLD) {
          setVisible(false)
        } else if (diff < -THRESHOLD) {
          setVisible(true)
        }

        lastScrollY.current = currentScrollY
        ticking.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return visible
}

export default function BottomNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const navVisible = useBottomNavScroll()

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/produk", icon: Package, label: "Produk" },
    { path: "/hargapromo", icon: BadgeDollarSign, label: "Diskon" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600&display=swap');

        .bottom-nav-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          justify-content: center;
          padding: 0 16px 16px;
          pointer-events: none;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bottom-nav-wrapper.nav-hidden {
          transform: translateY(calc(100% + 16px));
          opacity: 0;
        }

        .bottom-nav-wrapper.nav-visible {
          transform: translateY(0);
          opacity: 1;
        }

        .glass-nav {
          pointer-events: auto;
          position: relative;
          width: 100%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 40px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }

        .glass-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.35) 0%,
            rgba(180,220,255,0.12) 25%,
            rgba(255,180,220,0.08) 50%,
            rgba(180,255,220,0.10) 75%,
            rgba(255,255,255,0.25) 100%
          );
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
        }

        .glass-nav::after {
          content: '';
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.9) 30%,
            rgba(255,255,255,0.9) 70%,
            transparent
          );
          border-radius: 1px;
          z-index: 1;
        }

        .nav-list {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-around;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 10px 8px;
        }

        .nav-link {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 16px;
          border-radius: 28px;
          text-decoration: none;
          color: rgba(60, 60, 80, 0.7);
          font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: -0.01em;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .nav-link:hover {
          color: rgba(30, 30, 50, 0.85);
          background: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }

        .nav-link.active {
          color: rgba(20, 20, 40, 0.95);
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.10),
            0 1px 4px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255,255,255,0.8),
            inset 0 -1px 0 rgba(0,0,0,0.04);
          border: 1px solid rgba(255,255,255,0.70);
          transform: translateY(-2px) scale(1.04);
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            rgba(120,180,255,0.3),
            rgba(255,140,200,0.2),
            rgba(140,255,200,0.2)
          );
          opacity: 0.6;
          z-index: -1;
          filter: blur(4px);
        }

        .nav-icon {
          width: 22px;
          height: 22px;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-link.active .nav-icon {
          transform: scale(1.12);
          filter: drop-shadow(0 2px 4px rgba(80,120,200,0.25));
        }

        .nav-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1;
        }

        .active-dot {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6eb4ff, #c084fc);
          box-shadow: 0 0 6px rgba(110,180,255,0.6);
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.6; transform: translateX(-50%) scale(0.75); }
        }

        .laporan-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 16px;
          border-radius: 28px;
          color: rgba(60, 60, 80, 0.7);
          font-size: 10px;
          font-weight: 500;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }

        .laporan-wrapper:hover {
          color: rgba(30, 30, 50, 0.85);
          background: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
      `}</style>

      <div
        className={`md:hidden bottom-nav-wrapper ${navVisible ? "nav-visible" : "nav-hidden"}`}
      >
        <nav className="glass-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const IconComponent = item.icon
              const active = isActive(item.path)
              return (
                <li key={item.path} style={{ position: "relative" }}>
                  <Link
                    to={item.path}
                    className={`nav-link${active ? " active" : ""}`}
                  >
                    <IconComponent className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {active && <span className="active-dot" />}
                  </Link>
                </li>
              )
            })}

            <li style={{ position: "relative" }}>
              <div className="laporan-wrapper">
                <LaporanMenu />
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}