import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faQrcode,
  faCamera,
  faCameraRetro,
  faCheckCircle,
  faExclamationTriangle,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import Quagga from "quagga";
import "../../styles/barcode-scanner.scss";

const BarcodeScanner = ({ onBarcodeScanned, products }) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanningStatus, setScanningStatus] = useState("Ready");
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [scanResult, setScanResult] = useState({ type: null, message: "" });
  const [scannedProduct, setScannedProduct] = useState(null);
  const scannerContainerRef = useRef(null);
  const quaggaInitializedRef = useRef(false);
  const scanCooldownRef = useRef(false);
  const audioContextRef = useRef(null);

  // Initialize audio context for beep sound
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play beep sound
  const playBeep = (type = "success") => {
    try {
      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = type === "success" ? 800 : 400;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.2
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.log("Beep sound not supported:", error);
    }
  };

  // Function to get compressed image URL
  const getCompressedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (imageUrl.includes("firebasestorage.googleapis.com")) {
      // Compress image: max width 150px, max height 150px
      return `${imageUrl}?alt=media&width=150&height=150`;
    }

    return imageUrl;
  };

  // Process barcode scan
  const processBarcodeScan = (barcode) => {
    if (!barcode || barcode.trim() === "" || scanCooldownRef.current)
      return false;

    const cleanBarcode = barcode.toString().replace(/\D/g, "").trim();

    if (cleanBarcode.length === 0) {
      setScanResult({
        type: "error",
        message: "Invalid barcode format",
      });
      playBeep("error");
      setTimeout(() => setScanResult({ type: null, message: "" }), 2000);
      return false;
    }

    const now = Date.now();
    // FIXED: 1-second cooldown for same barcode, but allows increments after cooldown
    if (lastScannedCode === cleanBarcode && now - scanCount < 1000) {
      console.log(
        "🔄 Ignoring rapid duplicate scan (1s cooldown):",
        cleanBarcode
      );
      return false;
    }

    console.log("📷 Camera scanned barcode:", cleanBarcode);

    scanCooldownRef.current = true;
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1000);

    let scanSuccess = false;
    let foundProduct = null;

    // Find product first
    foundProduct = products.find((p) => {
      if (!p.barcode) return false;
      const productBarcode = p.barcode.toString().replace(/\D/g, "").trim();
      return productBarcode === cleanBarcode;
    });

    if (foundProduct) {
      setScannedProduct(foundProduct);

      // Call the parent component's handler
      if (onBarcodeScanned) {
        scanSuccess = onBarcodeScanned(cleanBarcode);

        if (scanSuccess) {
          setScanResult({
            type: "success",
            message: `Added ${foundProduct.name}!`,
          });
          playBeep("success");
        } else {
          setScanResult({
            type: "error",
            message: `Not enough stock for ${foundProduct.name}`,
          });
          playBeep("error");
        }
      }
    } else {
      setScannedProduct(null);
      setScanResult({
        type: "error",
        message: `Product not found: ${cleanBarcode}`,
      });
      playBeep("error");
    }

    setLastScannedCode(cleanBarcode);
    setScanCount(now);

    setScanHistory((prev) => {
      const newHistory = [...prev, cleanBarcode];
      return newHistory.slice(-5);
    });

    setScanningStatus(`Scanned: ${cleanBarcode}`);
    setTimeout(() => {
      if (isScanning) setScanningStatus("Scanning...");
    }, 1500);

    // Clear scan result and product after 3 seconds
    setTimeout(() => {
      setScanResult({ type: null, message: "" });
      setScannedProduct(null);
    }, 3000);

    return scanSuccess;
  };

  // Improved Quagga initialization
  const initQuagga = () => {
    if (!scannerContainerRef.current || quaggaInitializedRef.current) {
      return;
    }

    console.log("🎯 Initializing Quagga scanner...");

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
          area: {
            top: "0%",
            right: "0%",
            left: "0%",
            bottom: "0%",
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
          multiple: false,
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        locate: true,
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10,
      },
      (err) => {
        if (err) {
          console.error("❌ Quagga initialization error:", err);
          setCameraError(`Scanner error: ${err.message}`);
          setIsScanning(false);
          quaggaInitializedRef.current = false;
          return;
        }

        console.log("✅ Quagga initialized successfully");
        quaggaInitializedRef.current = true;

        Quagga.start();
        setScanningStatus("Scanning...");
        scanCooldownRef.current = false;
      }
    );

    Quagga.onDetected((result) => {
      if (result?.codeResult?.code) {
        const barcode = result.codeResult.code;
        console.log("🔍 Quagga detected barcode:", barcode);
        processBarcodeScan(barcode);
      }
    });

    Quagga.onProcessed((result) => {
      if (result) {
        const ctx = Quagga.canvas.ctx.overlay;
        const canvas = Quagga.canvas.dom.overlay;

        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.boxes) {
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 2;
            result.boxes.forEach((box) => {
              if (box !== result.box) {
                ctx.strokeRect(
                  box[0],
                  box[1],
                  box[2] - box[0],
                  box[3] - box[1]
                );
              }
            });
          }

          if (result.box) {
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 3;
            ctx.strokeRect(
              result.box[0],
              result.box[1],
              result.box[2] - result.box[0],
              result.box[3] - result.box[1]
            );
          }
        }
      }
    });
  };

  // Improved camera scanner function
  const startCameraScanner = async () => {
    try {
      setIsScanning(true);
      setCameraError("");
      setScanningStatus("Starting camera...");
      setScannedProduct(null);
      quaggaInitializedRef.current = false;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera not supported in this browser");
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      stream.getTracks().forEach((track) => track.stop());

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (scannerContainerRef.current) {
        console.log("🎯 Scanner container ready, initializing Quagga...");
        initQuagga();
      } else {
        console.error("❌ Scanner container not available");
        setCameraError("Scanner initialization failed");
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(`Camera error: ${error.message}`);
      setIsScanning(false);
      setScanningStatus("Error");
    }
  };

  const stopCameraScanner = () => {
    console.log("🛑 Stopping scanner...");

    setIsScanning(false);
    setCameraError("");
    setScanningStatus("Ready");
    setScannedProduct(null);
    quaggaInitializedRef.current = false;
    scanCooldownRef.current = false;

    try {
      Quagga.offDetected();
      Quagga.offProcessed();
      Quagga.stop();
    } catch (error) {
      console.log("Quagga cleanup completed");
    }

    if (scannerContainerRef.current) {
      scannerContainerRef.current.innerHTML = "";
    }
  };

  // Manual barcode handling
  const handleBarcodeScan = () => {
    if (barcodeInput.trim() === "") {
      setScanResult({
        type: "error",
        message: "Please enter a barcode",
      });
      playBeep("error");
      setTimeout(() => setScanResult({ type: null, message: "" }), 2000);
      return false;
    }
    const success = processBarcodeScan(barcodeInput);
    setBarcodeInput("");
    return success;
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
      e.preventDefault();
      handleBarcodeScan();
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setBarcodeInput(e.target.value);
  };

  // Auto-focus input when not scanning
  useEffect(() => {
    if (!isScanning) {
      const input = document.querySelector(".barcode-input");
      if (input) input.focus();
    }
  }, [isScanning]);

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

      {/* Scan Result Feedback */}
      {scanResult.type && (
        <div className={`scan-result ${scanResult.type}`}>
          <FontAwesomeIcon
            icon={
              scanResult.type === "success"
                ? faCheckCircle
                : faExclamationTriangle
            }
          />
          {scanResult.message}
        </div>
      )}

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
            autoFocus={!isScanning}
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

      {/* Camera Scanner Area with Product Preview */}
      {isScanning && (
        <div className="camera-scanner-area active">
          <div className="scanner-preview-container">
            {/* Camera Preview */}
            <div className="camera-container">
              <div
                ref={scannerContainerRef}
                id="scanner-container"
                className="scanner-view"
              >
                <div className="camera-placeholder">
                  {scanningStatus.includes("Starting")
                    ? "Initializing camera..."
                    : "Camera active - scanning..."}
                </div>
              </div>

              <p className="camera-instruction">
                📷 Point camera at barcodes. Items auto-add to order.
              </p>
            </div>

            {/* Product Preview Sidebar */}
            <div className="product-preview-sidebar">
              <h4>Scanned Product</h4>

              {scannedProduct ? (
                <div className="scanned-product-card">
                  {scannedProduct.imageUrl ? (
                    <div className="product-image-preview">
                      <img
                        src={getCompressedImageUrl(scannedProduct.imageUrl)}
                        alt={scannedProduct.name}
                        className="compressed-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="image-placeholder">
                        <FontAwesomeIcon icon={faImage} />
                        <span>No Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="image-placeholder">
                      <FontAwesomeIcon icon={faImage} />
                      <span>No Image</span>
                    </div>
                  )}

                  <div className="product-info-preview">
                    <h5 className="product-name">{scannedProduct.name}</h5>
                    <p className="product-category">
                      {scannedProduct.category}
                    </p>
                    <div className="product-details-preview">
                      <span className="product-price">
                        ₱{scannedProduct.price?.toFixed(2)}
                      </span>
                      <span
                        className={`stock-badge ${
                          scannedProduct.stock < 5 ? "low-stock" : ""
                        }`}
                      >
                        Stock: {scannedProduct.stock}
                      </span>
                    </div>
                    {scannedProduct.barcode && (
                      <small className="product-barcode-preview">
                        Barcode: {scannedProduct.barcode}
                      </small>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-product-preview">
                  <FontAwesomeIcon icon={faBarcode} size="2x" />
                  <p>Scan a barcode to see product details</p>
                </div>
              )}
            </div>
          </div>

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
            <li>Items automatically add to order</li>
            <li>Press Space or Enter to add manual entries</li>
            <li>Same barcode can be scanned after 1-second cooldown</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
