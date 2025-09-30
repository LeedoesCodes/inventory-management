import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faQrcode,
  faCamera,
  faCameraRetro,
} from "@fortawesome/free-solid-svg-icons";
import Quagga from "quagga";
import "../../styles/barcode-scanner.scss";

const BarcodeScanner = ({ onBarcodeScanned, products }) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanningStatus, setScanningStatus] = useState("Ready");
  const scannerContainerRef = useRef(null);

  // Process barcode scan
  const processBarcodeScan = (barcode) => {
    if (!barcode || barcode.trim() === "") return;

    // Clean the barcode - remove any non-numeric characters except digits
    const cleanBarcode = barcode.toString().replace(/\D/g, "").trim();

    if (cleanBarcode.length === 0) {
      alert("Invalid barcode format");
      return;
    }

    console.log("📷 Camera scanned barcode:", cleanBarcode);

    // Call the parent component's handler
    if (onBarcodeScanned) {
      onBarcodeScanned(cleanBarcode);
    }

    // Add to scan history
    setScanHistory((prev) => [...prev.slice(-4), cleanBarcode]);

    // Show success feedback
    setScanningStatus(`✅ Found: ${cleanBarcode}`);
    setTimeout(() => {
      if (isScanning) setScanningStatus("Scanning...");
    }, 2000);
  };

  // Initialize Quagga barcode scanner
  const initQuagga = () => {
    if (!scannerContainerRef.current) {
      console.error("Scanner container not found");
      return;
    }

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerContainerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment",
          },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_128_reader",
            "code_39_reader",
          ],
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        locate: true,
        numOfWorkers: 2,
      },
      (err) => {
        if (err) {
          console.error("Quagga initialization error:", err);
          setCameraError(`Scanner error: ${err.message}`);
          setIsScanning(false);
          return;
        }
        console.log("✅ Quagga initialized successfully");
        Quagga.start();
        setScanningStatus("Scanning...");
      }
    );

    // Handle detected barcodes
    Quagga.onDetected((result) => {
      if (result.codeResult && result.codeResult.code) {
        const barcode = result.codeResult.code;
        console.log("🔍 Quagga detected barcode:", barcode);

        // Check if this is a new barcode (not recently scanned)
        const isNewBarcode =
          !scanHistory.includes(barcode) &&
          !scanHistory.slice(-2).includes(barcode);

        if (isNewBarcode) {
          processBarcodeScan(barcode);

          // Briefly pause scanning to prevent duplicates
          Quagga.stop();
          setTimeout(() => {
            if (isScanning) {
              Quagga.start();
              setScanningStatus("Scanning...");
            }
          }, 1000);
        }
      }
    });
  };

  // Camera barcode scanner function
  const startCameraScanner = async () => {
    try {
      setIsScanning(true);
      setCameraError("");
      setScanningStatus("Starting camera...");

      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera not supported in this browser");
        setIsScanning(false);
        return;
      }

      // Test camera access first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());

      // Wait for the container to be ready
      setTimeout(() => {
        if (scannerContainerRef.current) {
          console.log("🎯 Scanner container ready, initializing Quagga...");
          initQuagga();
        } else {
          console.error("❌ Scanner container not available");
          setCameraError("Scanner initialization failed");
          setIsScanning(false);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(`Camera error: ${error.message}`);
      setIsScanning(false);
      setScanningStatus("Error");
    }
  };

  const stopCameraScanner = () => {
    console.log("🛑 Stopping scanner...");

    // Stop Quagga
    try {
      Quagga.stop();
      Quagga.offDetected();
      Quagga.offProcessed();
    } catch (error) {
      console.log("Quagga cleanup:", error);
    }

    setIsScanning(false);
    setCameraError("");
    setScanningStatus("Ready");
  };

  // Manual barcode handling
  const handleBarcodeScan = () => {
    if (barcodeInput.trim() === "") {
      alert("Please enter a barcode");
      return;
    }
    processBarcodeScan(barcodeInput);
    setBarcodeInput("");
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleBarcodeScan();
    }
  };

  // Handle space bar press on input
  const handleKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault(); // Prevent space from adding to input
      handleBarcodeScan();
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setBarcodeInput(e.target.value);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  return (
    <div className="barcode-scanner-section">
      <div className="scanner-header">
        <h3>
          <FontAwesomeIcon icon={faBarcode} />
          Barcode Scanner
        </h3>
        <div className="scanner-status">
          {isScanning ? `📷 ${scanningStatus}` : "✅ Ready to Scan"}
        </div>
      </div>

      <div className="scanner-controls">
        <div className="barcode-input-group">
          <input
            type="text"
            placeholder="Enter barcode (Press Space or Enter to add)"
            value={barcodeInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            className="barcode-input"
          />
          <button
            onClick={handleBarcodeScan}
            className="scan-button"
            disabled={!barcodeInput.trim()}
          >
            <FontAwesomeIcon icon={faQrcode} />
            Add Product
          </button>
        </div>

        <div className="scanner-options">
          {!isScanning ? (
            <button className="camera-scan-btn" onClick={startCameraScanner}>
              <FontAwesomeIcon icon={faCamera} />
              Start Camera Scanner
            </button>
          ) : (
            <button className="stop-camera-btn" onClick={stopCameraScanner}>
              <FontAwesomeIcon icon={faCameraRetro} />
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Camera Scanner Area - Only shown when scanning */}
      {isScanning && (
        <div className="camera-scanner-area active">
          <div className="camera-container">
            <div
              ref={scannerContainerRef}
              id="scanner-container"
              style={{
                width: "100%",
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
                borderRadius: "8px",
              }}
            >
              <div style={{ color: "white", textAlign: "center" }}>
                Initializing camera...
              </div>
            </div>
          </div>

          <p className="camera-instruction">
            📷 Point your camera at barcodes. Scanner pauses briefly after each
            scan.
          </p>
          <div className="scanning-overlay">
            <div className="scan-line"></div>
          </div>

          {cameraError && <div className="camera-error">{cameraError}</div>}
        </div>
      )}

      {scanHistory.length > 0 && (
        <div className="scan-history">
          <small>Recent scans: {scanHistory.slice(-3).join(", ")}</small>
        </div>
      )}

      {/* Tips for better scanning */}
      {isScanning && (
        <div className="scanning-tips">
          <h4>💡 Scanning Tips:</h4>
          <ul>
            <li>Hold barcode steady in camera view</li>
            <li>Ensure good, even lighting</li>
            <li>Move closer if the barcode is small</li>
            <li>Scanner auto-resumes after each scan</li>
            <li>Press Space or Enter to add manual entries</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
