import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import "./packagingmanager.scss";

export default function PackagingManager({ products, onUpdate }) {
  const [singleProducts, setSingleProducts] = useState([]);
  const [bulkProducts, setBulkProducts] = useState([]);
  const [selectedSingleProduct, setSelectedSingleProduct] = useState("");
  const [newBulkConfig, setNewBulkConfig] = useState({
    name: "",
    piecesPerPackage: "",
    price: "",
    costPrice: "",
    stock: "",
  });
  const [breakingBulk, setBreakingBulk] = useState({});
  const [convertingToBulk, setConvertingToBulk] = useState({});

  // Memoized helper functions
  const getBulkPackagesForSingle = useCallback(
    (singleProductId) => {
      return bulkProducts.filter((p) => p.parentProductId === singleProductId);
    },
    [bulkProducts]
  );

  const getSingleProductForBulk = useCallback(
    (bulkProductId) => {
      const bulkProduct = bulkProducts.find((p) => p.id === bulkProductId);
      return singleProducts.find((p) => p.id === bulkProduct?.parentProductId);
    },
    [bulkProducts, singleProducts]
  );

  useEffect(() => {
    // Separate single and bulk products
    const singles = products.filter((p) => p.packagingType === "single");
    const bulks = products.filter((p) => p.packagingType === "bulk");

    setSingleProducts(singles);
    setBulkProducts(bulks);
  }, [products]);

  // Helper functions to check if sections should show empty states
  const hasSingleProducts = singleProducts.length > 0;
  const hasBulkProducts = bulkProducts.length > 0;
  const hasPackagingRelationships = singleProducts.some(
    (single) => getBulkPackagesForSingle(single.id).length > 0
  );

  const handleCreateBulkPackage = async () => {
    if (!selectedSingleProduct || !newBulkConfig.piecesPerPackage) {
      alert("Please select a product and specify pieces per package");
      return;
    }

    const singleProduct = singleProducts.find(
      (p) => p.id === selectedSingleProduct
    );
    if (!singleProduct) return;

    try {
      // Calculate suggested prices if not provided
      const calculatedPrice =
        newBulkConfig.price ||
        (singleProduct.price * newBulkConfig.piecesPerPackage * 0.9).toFixed(2);
      const calculatedCost =
        newBulkConfig.costPrice ||
        (singleProduct.costPrice * newBulkConfig.piecesPerPackage).toFixed(2);

      const bulkProductData = {
        name:
          newBulkConfig.name ||
          `${singleProduct.name} - ${newBulkConfig.piecesPerPackage} Pack`,
        price: parseFloat(calculatedPrice),
        costPrice: calculatedCost ? parseFloat(calculatedCost) : null,
        stock: parseInt(newBulkConfig.stock) || 0,
        category: singleProduct.category,
        barcode: "",
        unit: "pack",
        packagingType: "bulk",
        piecesPerPackage: parseInt(newBulkConfig.piecesPerPackage),
        parentProductId: selectedSingleProduct,
        isBulkPackage: true,
        imageUrl: singleProduct.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firebase
      await addDoc(collection(db, "products"), bulkProductData);

      // Reset form
      setNewBulkConfig({
        name: "",
        piecesPerPackage: "",
        price: "",
        costPrice: "",
        stock: "",
      });
      setSelectedSingleProduct("");

      alert("Bulk package created successfully!");
      onUpdate(); // Refresh products
    } catch (error) {
      console.error("Error creating bulk package:", error);
      alert("Error creating bulk package: " + error.message);
    }
  };

  const handleBreakBulk = async (bulkProductId, quantity) => {
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    const bulkProduct = bulkProducts.find((p) => p.id === bulkProductId);
    const singleProduct = getSingleProductForBulk(bulkProductId);

    if (!bulkProduct || !singleProduct) {
      alert("Invalid product configuration");
      return;
    }

    if (bulkProduct.stock < quantity) {
      alert(`Only ${bulkProduct.stock} packages available`);
      return;
    }

    try {
      const piecesToAdd = quantity * bulkProduct.piecesPerPackage;

      // Update stocks
      await updateDoc(doc(db, "products", bulkProductId), {
        stock: bulkProduct.stock - quantity,
        updatedAt: new Date(),
      });

      await updateDoc(doc(db, "products", singleProduct.id), {
        stock: singleProduct.stock + piecesToAdd,
        updatedAt: new Date(),
      });

      // Record the conversion
      await addDoc(collection(db, "packagingConversions"), {
        bulkProductId,
        singleProductId: singleProduct.id,
        packagesBroken: quantity,
        piecesCreated: piecesToAdd,
        convertedAt: new Date(),
        type: "break_bulk",
      });

      setBreakingBulk({ ...breakingBulk, [bulkProductId]: "" });
      alert(
        `Successfully broke ${quantity} package(s) into ${piecesToAdd} pieces`
      );
      onUpdate(); // Refresh products
    } catch (error) {
      console.error("Error breaking bulk:", error);
      alert("Error breaking bulk: " + error.message);
    }
  };

  const handleConvertToBulk = async (singleProductId, packagesToCreate) => {
    if (!packagesToCreate || packagesToCreate <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    const singleProduct = singleProducts.find((p) => p.id === singleProductId);
    const bulkPackages = getBulkPackagesForSingle(singleProductId);

    if (bulkPackages.length === 0) {
      alert("No bulk package found for this product");
      return;
    }

    // Use the first bulk package found for this single product
    const bulkProduct = bulkPackages[0];
    const piecesNeeded = packagesToCreate * bulkProduct.piecesPerPackage;

    if (singleProduct.stock < piecesNeeded) {
      alert(
        `Need ${piecesNeeded} pieces, but only ${singleProduct.stock} available`
      );
      return;
    }

    try {
      // Update stocks
      await updateDoc(doc(db, "products", singleProduct.id), {
        stock: singleProduct.stock - piecesNeeded,
        updatedAt: new Date(),
      });

      await updateDoc(doc(db, "products", bulkProduct.id), {
        stock: bulkProduct.stock + packagesToCreate,
        updatedAt: new Date(),
      });

      // Record the conversion
      await addDoc(collection(db, "packagingConversions"), {
        bulkProductId: bulkProduct.id,
        singleProductId,
        packagesCreated: packagesToCreate,
        piecesUsed: piecesNeeded,
        convertedAt: new Date(),
        type: "create_bulk",
      });

      setConvertingToBulk({ ...convertingToBulk, [singleProductId]: "" });
      alert(
        `Successfully created ${packagesToCreate} packages from ${piecesNeeded} pieces`
      );
      onUpdate(); // Refresh products
    } catch (error) {
      console.error("Error converting to bulk:", error);
      alert("Error converting to bulk: " + error.message);
    }
  };

  return (
    <div className="packaging-manager">
      <div className="packaging-header">
        <h2>Packaging Management</h2>
        <p>Manage relationships between individual items and bulk packages</p>
      </div>

      <div className="packaging-sections">
        {/* Create New Bulk Package */}
        <div className="packaging-section">
          <h3>Create New Bulk Package</h3>
          <div className="create-bulk-form">
            <div className="form-group">
              <label>Select Individual Product</label>
              <select
                value={selectedSingleProduct}
                onChange={(e) => setSelectedSingleProduct(e.target.value)}
              >
                <option value="">Choose individual product</option>
                {singleProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (₱{product.price} per piece)
                  </option>
                ))}
              </select>
            </div>

            {!hasSingleProducts && (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Individual Products Found</h3>
                <p>
                  You need to create individual products first before creating
                  bulk packages.
                </p>
                <div className="empty-actions">
                  <p>
                    <strong>Next Steps:</strong>
                  </p>
                  <ol>
                    <li>Go to "Products List" tab</li>
                    <li>Add products with "Single Item" packaging type</li>
                    <li>Return here to create bulk packages</li>
                  </ol>
                </div>
              </div>
            )}

            {selectedSingleProduct && (
              <>
                <div className="form-group">
                  <label>Package Name</label>
                  <input
                    type="text"
                    value={newBulkConfig.name}
                    onChange={(e) =>
                      setNewBulkConfig({
                        ...newBulkConfig,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Chips - 50 Pack"
                  />
                </div>

                <div className="form-group">
                  <label>Pieces per Package *</label>
                  <input
                    type="number"
                    value={newBulkConfig.piecesPerPackage}
                    onChange={(e) =>
                      setNewBulkConfig({
                        ...newBulkConfig,
                        piecesPerPackage: e.target.value,
                      })
                    }
                    min="1"
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Package Price (₱)</label>
                    <input
                      type="number"
                      value={newBulkConfig.price}
                      onChange={(e) =>
                        setNewBulkConfig({
                          ...newBulkConfig,
                          price: e.target.value,
                        })
                      }
                      step="0.01"
                      placeholder="Auto-calculated"
                    />
                  </div>

                  <div className="form-group">
                    <label>Package Cost (₱)</label>
                    <input
                      type="number"
                      value={newBulkConfig.costPrice}
                      onChange={(e) =>
                        setNewBulkConfig({
                          ...newBulkConfig,
                          costPrice: e.target.value,
                        })
                      }
                      step="0.01"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Stock</label>
                  <input
                    type="number"
                    value={newBulkConfig.stock}
                    onChange={(e) =>
                      setNewBulkConfig({
                        ...newBulkConfig,
                        stock: e.target.value,
                      })
                    }
                    min="0"
                    placeholder="0"
                  />
                </div>

                <button
                  onClick={handleCreateBulkPackage}
                  className="btn-primary"
                >
                  Create Bulk Package
                </button>
              </>
            )}
          </div>
        </div>

        {/* Break Bulk Packages */}
        <div className="packaging-section">
          <h3>Break Bulk Packages into Pieces</h3>
          <div className="bulk-breakdown-list">
            {!hasBulkProducts ? (
              <div className="empty-state">
                <div className="empty-icon">🔓</div>
                <h3>No Bulk Packages Available</h3>
                <p>
                  Create bulk packages first to break them down into individual
                  pieces.
                </p>
              </div>
            ) : (
              bulkProducts.map((bulkProduct) => {
                const singleProduct = getSingleProductForBulk(bulkProduct.id);
                if (!singleProduct) return null;

                return (
                  <div key={bulkProduct.id} className="bulk-item">
                    <div className="product-info">
                      <h4>{bulkProduct.name}</h4>
                      <div className="product-details">
                        <span>
                          1 {bulkProduct.unit} = {bulkProduct.piecesPerPackage}{" "}
                          pieces
                        </span>
                        <span>Stock: {bulkProduct.stock} packages</span>
                        <span>Contains: {singleProduct.name}</span>
                      </div>
                    </div>

                    <div className="break-action">
                      <input
                        type="number"
                        value={breakingBulk[bulkProduct.id] || ""}
                        onChange={(e) =>
                          setBreakingBulk({
                            ...breakingBulk,
                            [bulkProduct.id]: e.target.value,
                          })
                        }
                        placeholder="Packages to break"
                        min="1"
                        max={bulkProduct.stock}
                      />
                      <button
                        onClick={() =>
                          handleBreakBulk(
                            bulkProduct.id,
                            parseInt(breakingBulk[bulkProduct.id])
                          )
                        }
                        disabled={
                          !breakingBulk[bulkProduct.id] ||
                          breakingBulk[bulkProduct.id] <= 0
                        }
                      >
                        Break
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Convert Pieces to Bulk */}
        <div className="packaging-section">
          <h3>Convert Pieces to Bulk Packages</h3>
          <div className="bulk-creation-list">
            {!hasPackagingRelationships ? (
              <div className="empty-state">
                <div className="empty-icon">🔄</div>
                <h3>No Packaging Relationships</h3>
                <p>
                  Create bulk packages first to convert individual pieces back
                  to bulk.
                </p>
              </div>
            ) : (
              singleProducts.map((singleProduct) => {
                const bulkPackages = getBulkPackagesForSingle(singleProduct.id);
                if (bulkPackages.length === 0) return null;

                return bulkPackages.map((bulkProduct) => (
                  <div key={bulkProduct.id} className="single-item">
                    <div className="product-info">
                      <h4>{singleProduct.name}</h4>
                      <div className="product-details">
                        <span>Stock: {singleProduct.stock} pieces</span>
                        <span>
                          Can create:{" "}
                          {Math.floor(
                            singleProduct.stock / bulkProduct.piecesPerPackage
                          )}{" "}
                          packages
                        </span>
                        <span>For: {bulkProduct.name}</span>
                      </div>
                    </div>

                    <div className="convert-action">
                      <input
                        type="number"
                        value={convertingToBulk[singleProduct.id] || ""}
                        onChange={(e) =>
                          setConvertingToBulk({
                            ...convertingToBulk,
                            [singleProduct.id]: e.target.value,
                          })
                        }
                        placeholder="Packages to create"
                        min="1"
                        max={Math.floor(
                          singleProduct.stock / bulkProduct.piecesPerPackage
                        )}
                      />
                      <button
                        onClick={() =>
                          handleConvertToBulk(
                            singleProduct.id,
                            parseInt(convertingToBulk[singleProduct.id])
                          )
                        }
                        disabled={
                          !convertingToBulk[singleProduct.id] ||
                          convertingToBulk[singleProduct.id] <= 0
                        }
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ));
              })
            )}
          </div>
        </div>

        {/* Packaging Relationships Overview */}
        <div className="packaging-section">
          <h3>Packaging Relationships</h3>
          <div className="relationships-grid">
            {!hasPackagingRelationships ? (
              <div className="empty-state">
                <div className="empty-icon">🔗</div>
                <h3>No Packaging Relationships Yet</h3>
                <p>
                  Create your first bulk package to see packaging relationships
                  here.
                </p>
                <div className="empty-actions">
                  <p>
                    <strong>How it works:</strong>
                  </p>
                  <ul>
                    <li>Individual products are sold as single pieces</li>
                    <li>Bulk packages contain multiple individual pieces</li>
                    <li>You can convert between them as needed</li>
                  </ul>
                </div>
              </div>
            ) : (
              singleProducts.map((singleProduct) => {
                const relatedBulks = getBulkPackagesForSingle(singleProduct.id);
                if (relatedBulks.length === 0) return null;

                return (
                  <div key={singleProduct.id} className="relationship-group">
                    <div className="single-product-card">
                      <h4>{singleProduct.name}</h4>
                      <p>{singleProduct.stock} pieces available</p>
                    </div>

                    <div className="bulk-products-list">
                      {relatedBulks.map((bulkProduct) => (
                        <div key={bulkProduct.id} className="bulk-product-card">
                          <div className="bulk-info">
                            <strong>{bulkProduct.name}</strong>
                            <span>{bulkProduct.stock} packages</span>
                            <span>
                              {bulkProduct.piecesPerPackage} pieces each
                            </span>
                            <span>₱{bulkProduct.price} per package</span>
                          </div>
                          <div className="conversion-info">
                            <div>
                              1 package = {bulkProduct.piecesPerPackage} pieces
                            </div>
                            <div>
                              1 piece ={" "}
                              {(
                                (bulkProduct.price /
                                  bulkProduct.piecesPerPackage /
                                  singleProduct.price) *
                                  100 -
                                100
                              ).toFixed(1)}
                              % discount
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
