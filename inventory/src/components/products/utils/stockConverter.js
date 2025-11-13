// src/components/products/utils/stockConverter.js

export class StockConverter {
  /**
   * Calculate available stock for a product, including bulk package conversions
   * @param {Object} product - The product to check
   * @param {Array} allProducts - All products from the database
   * @returns {number} - Total available stock including bulk packages
   */
  static getAvailableStock(product, allProducts) {
    if (!product || !allProducts) return 0;

    let availableStock = product.stock || 0;

    // For single items, add stock from bulk packages that can be converted
    if (product.packagingType === "single") {
      const bulkPackages = allProducts.filter(
        (p) =>
          p.parentProductId === product.id &&
          p.packagingType === "bulk" &&
          p.stock > 0
      );

      bulkPackages.forEach((bulk) => {
        // Add the equivalent individual pieces from bulk packages
        const piecesPerPackage = bulk.piecesPerPackage || 1;
        availableStock += bulk.stock * piecesPerPackage;
      });
    }

    return availableStock;
  }

  /**
   * Check if automatic conversion is possible for an order
   * @param {Array} allProducts - All products from the database
   * @param {string} singleProductId - The single product ID that needs stock
   * @param {number} requiredQuantity - How many individual pieces needed
   * @returns {boolean} - Whether conversion is possible
   */
  static canAutoConvert(allProducts, singleProductId, requiredQuantity) {
    const singleProduct = allProducts.find((p) => p.id === singleProductId);
    if (!singleProduct) return false;

    const currentSingleStock = singleProduct.stock || 0;

    // If we have enough single items, no conversion needed
    if (currentSingleStock >= requiredQuantity) return true;

    const neededFromBulk = requiredQuantity - currentSingleStock;
    const availableFromBulk = allProducts
      .filter(
        (p) =>
          p.parentProductId === singleProductId && p.packagingType === "bulk"
      )
      .reduce((total, bulk) => {
        const piecesPerPackage = bulk.piecesPerPackage || 1;
        return total + bulk.stock * piecesPerPackage;
      }, 0);

    return availableFromBulk >= neededFromBulk;
  }

  /**
   * Convert bulk packages to individual pieces when single items run out
   * @param {Array} allProducts - All products from the database
   * @param {string} singleProductId - The single product ID that needs stock
   * @param {number} requiredQuantity - How many individual pieces needed
   * @returns {Object} - Conversion result with updated products and updates
   */
  static async convertBulkToSingle(
    allProducts,
    singleProductId,
    requiredQuantity
  ) {
    try {
      const singleProduct = allProducts.find((p) => p.id === singleProductId);
      if (!singleProduct || singleProduct.packagingType !== "single") {
        return { success: false, message: "Invalid single product" };
      }

      const bulkPackages = allProducts
        .filter(
          (p) =>
            p.parentProductId === singleProductId &&
            p.packagingType === "bulk" &&
            p.stock > 0
        )
        .sort((a, b) => (a.piecesPerPackage || 1) - (b.piecesPerPackage || 1)); // Use smaller packages first

      let remainingQuantity = requiredQuantity;
      const updates = [];
      const updatedProducts = [...allProducts];

      for (const bulk of bulkPackages) {
        if (remainingQuantity <= 0) break;

        const piecesPerBulk = bulk.piecesPerPackage || 1;
        const piecesInBulk = bulk.stock * piecesPerBulk;

        if (piecesInBulk >= remainingQuantity) {
          // This bulk package has enough pieces
          const bulkPackagesToConvert = Math.ceil(
            remainingQuantity / piecesPerBulk
          );
          const piecesConverted = bulkPackagesToConvert * piecesPerBulk;

          // Update bulk stock
          const bulkIndex = updatedProducts.findIndex((p) => p.id === bulk.id);
          if (bulkIndex !== -1) {
            updatedProducts[bulkIndex].stock -= bulkPackagesToConvert;
          }

          // Update single product stock (add the converted pieces)
          const singleIndex = updatedProducts.findIndex(
            (p) => p.id === singleProductId
          );
          if (singleIndex !== -1) {
            updatedProducts[singleIndex].stock += piecesConverted;
          }

          updates.push({
            productId: bulk.id,
            type: "bulk",
            quantity: -bulkPackagesToConvert,
            piecesConverted: piecesConverted,
            reason: `Converted ${bulkPackagesToConvert} bulk packages to ${piecesConverted} individual pieces`,
          });

          updates.push({
            productId: singleProductId,
            type: "single",
            quantity: piecesConverted,
            reason: `Converted from ${bulkPackagesToConvert} bulk packages`,
          });

          remainingQuantity -= piecesConverted;
        } else {
          // Use all available bulk packages
          const bulkPackagesToConvert = bulk.stock;
          const piecesConverted = bulkPackagesToConvert * piecesPerBulk;

          // Update bulk stock
          const bulkIndex = updatedProducts.findIndex((p) => p.id === bulk.id);
          if (bulkIndex !== -1) {
            updatedProducts[bulkIndex].stock = 0;
          }

          // Update single product stock
          const singleIndex = updatedProducts.findIndex(
            (p) => p.id === singleProductId
          );
          if (singleIndex !== -1) {
            updatedProducts[singleIndex].stock += piecesConverted;
          }

          updates.push({
            productId: bulk.id,
            type: "bulk",
            quantity: -bulkPackagesToConvert,
            piecesConverted: piecesConverted,
            reason: `Converted all ${bulkPackagesToConvert} bulk packages to ${piecesConverted} individual pieces`,
          });

          updates.push({
            productId: singleProductId,
            type: "single",
            quantity: piecesConverted,
            reason: `Converted from all ${bulkPackagesToConvert} bulk packages`,
          });

          remainingQuantity -= piecesConverted;
        }
      }

      if (remainingQuantity > 0) {
        return {
          success: false,
          message: `Only ${
            requiredQuantity - remainingQuantity
          } pieces available after conversion`,
        };
      }

      return {
        success: true,
        updatedProducts,
        updates,
        message: `Successfully converted bulk packages to meet demand`,
      };
    } catch (error) {
      console.error("Stock conversion error:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get bulk packages for a single product
   * @param {string} singleProductId - The single product ID
   * @param {Array} allProducts - All products from the database
   * @returns {Array} - Array of bulk packages
   */
  static getBulkPackagesForSingle(singleProductId, allProducts) {
    return allProducts.filter(
      (p) => p.parentProductId === singleProductId && p.packagingType === "bulk"
    );
  }

  /**
   * Get single product for a bulk package
   * @param {string} bulkProductId - The bulk product ID
   * @param {Array} allProducts - All products from the database
   * @returns {Object|null} - The parent single product
   */
  static getSingleProductForBulk(bulkProductId, allProducts) {
    const bulkProduct = allProducts.find((p) => p.id === bulkProductId);
    if (!bulkProduct || bulkProduct.packagingType !== "bulk") return null;

    return allProducts.find((p) => p.id === bulkProduct.parentProductId);
  }

  /**
   * Calculate total pieces available from bulk packages for a single product
   * @param {string} singleProductId - The single product ID
   * @param {Array} allProducts - All products from the database
   * @returns {number} - Total pieces available from bulk packages
   */
  static getBulkStockForSingle(singleProductId, allProducts) {
    const bulkPackages = this.getBulkPackagesForSingle(
      singleProductId,
      allProducts
    );
    return bulkPackages.reduce((total, bulk) => {
      const piecesPerPackage = bulk.piecesPerPackage || 1;
      return total + bulk.stock * piecesPerPackage;
    }, 0);
  }

  /**
   * Check if a product has bulk packages available
   * @param {Object} product - The product to check
   * @param {Array} allProducts - All products from the database
   * @returns {boolean} - Whether bulk packages are available
   */
  static hasBulkPackages(product, allProducts) {
    if (!product || product.packagingType !== "single") return false;

    const bulkPackages = this.getBulkPackagesForSingle(product.id, allProducts);
    return bulkPackages.some((bulk) => bulk.stock > 0);
  }

  /**
   * Get detailed stock breakdown for a product
   * @param {Object} product - The product to analyze
   * @param {Array} allProducts - All products from the database
   * @returns {Object} - Detailed stock information
   */
  static getStockBreakdown(product, allProducts) {
    if (!product) {
      return {
        singleStock: 0,
        bulkStock: 0,
        totalAvailable: 0,
        bulkPackages: [],
        hasBulk: false,
      };
    }

    if (product.packagingType === "bulk") {
      return {
        singleStock: 0,
        bulkStock: product.stock || 0,
        totalAvailable: product.stock || 0,
        bulkPackages: [],
        hasBulk: false,
      };
    }

    const bulkPackages = this.getBulkPackagesForSingle(product.id, allProducts);
    const bulkStock = bulkPackages.reduce((total, bulk) => {
      const piecesPerPackage = bulk.piecesPerPackage || 1;
      return total + bulk.stock * piecesPerPackage;
    }, 0);

    const singleStock = product.stock || 0;
    const totalAvailable = singleStock + bulkStock;

    return {
      singleStock,
      bulkStock,
      totalAvailable,
      bulkPackages: bulkPackages.map((bulk) => ({
        id: bulk.id,
        name: bulk.name,
        packageStock: bulk.stock,
        piecesPerPackage: bulk.piecesPerPackage || 1,
        totalPieces: bulk.stock * (bulk.piecesPerPackage || 1),
      })),
      hasBulk: bulkStock > 0,
    };
  }
}

export default StockConverter;
