import React, { useState, useRef, useEffect } from "react";

const LazyChart = ({ children, height = 300, placeholder = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // Start loading when 50px away
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: height }}>
      {isVisible
        ? children
        : placeholder || (
            <div
              style={{
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              Loading chart...
            </div>
          )}
    </div>
  );
};

export default LazyChart;
