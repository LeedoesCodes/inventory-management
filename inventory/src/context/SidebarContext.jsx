import { createContext, useContext, useState, useEffect } from "react";

export const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with current window width
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Robust mobile detection with debouncing
  useEffect(() => {
    let timeoutId;

    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Auto-close mobile sidebar when switching to desktop
      if (!mobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150); // Debounce resize events
    };

    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isMobileSidebarOpen]);

  const toggleSidebar = () => {
    console.log("Toggle sidebar called - isMobile:", isMobile);
    if (isMobile) {
      // Toggle mobile sidebar
      setIsMobileSidebarOpen((prev) => {
        console.log("Setting mobile sidebar to:", !prev);
        return !prev;
      });
    } else {
      // Toggle desktop sidebar collapse
      setIsCollapsed((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      console.log("Closing mobile sidebar");
      setIsMobileSidebarOpen(false);
    }
  };

  const openMobileSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    }
  };

  // Debug log to verify context values
  useEffect(() => {
    console.log("SidebarContext updated:", {
      isMobile,
      isMobileSidebarOpen,
      isCollapsed,
    });
  }, [isMobile, isMobileSidebarOpen, isCollapsed]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobile,
        isMobileSidebarOpen,
        toggleSidebar,
        closeMobileSidebar,
        openMobileSidebar,
        setIsCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
