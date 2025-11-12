// utils/stockConverter.js
export class StockConverter {
  /**
   * Convert bulk packages to individual pieces when single items run out
   * @param {Array} allProducts - All products from Firestore
   * @param {string} singleProductId - The single product ID that needs stock
   * @param {number} requiredQuantity - How many individual pieces needed
   * @returns {Object} - {success: boolean, updatedProducts: Array, message: string}
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
        .sort((a, b) => a.piecesPerPackage - b.piecesPerPackage); // Use smaller packages first

      let remainingQuantity = requiredQuantity;
      const updates = [];
      const updatedProducts = [...allProducts];

      for (const bulk of bulkPackages) {
        if (remainingQuantity <= 0) break;

        const piecesInBulk = bulk.stock * bulk.piecesPerPackage;

        if (piecesInBulk >= remainingQuantity) {
          // This bulk package has enough pieces
          const bulkPackagesToConvert = Math.ceil(
            remainingQuantity / bulk.piecesPerPackage
          );
          const piecesConverted = bulkPackagesToConvert * bulk.piecesPerPackage;

          // Update bulk stock
          const bulkIndex = updatedProducts.findIndex((p) => p.id === bulk.id);
          updatedProducts[bulkIndex].stock -= bulkPackagesToConvert;

          // Update single product stock (add the converted pieces)
          const singleIndex = updatedProducts.findIndex(
            (p) => p.id === singleProductId
          );
          updatedProducts[singleIndex].stock += piecesConverted;

          updates.push({
            productId: bulk.id,
            type: "bulk",
            quantity: -bulkPackagesToConvert,
            reason: `Converted to ${piecesConverted} individual pieces`,
          });

          updates.push({
            productId: singleProductId,
            type: "single",
            quantity: piecesConverted,
            reason: `Converted from ${bulkPackagesToConvert} bulk packages`,
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
   * Check if automatic conversion is possible for an order
   */
  static canAutoConvert(allProducts, singleProductId, requiredQuantity) {
    const singleProduct = allProducts.find((p) => p.id === singleProductId);
    if (!singleProduct) return false;

    const currentSingleStock = singleProduct.stock || 0;
    if (currentSingleStock >= requiredQuantity) return true;

    const neededFromBulk = requiredQuantity - currentSingleStock;
    const availableFromBulk = allProducts
      .filter(
        (p) =>
          p.parentProductId === singleProductId && p.packagingType === "bulk"
      )
      .reduce((total, bulk) => total + bulk.stock * bulk.piecesPerPackage, 0);

    return availableFromBulk >= neededFromBulk;
  }

  /**
   * Get available stock including potential bulk conversions
   */
  static getAvailableStock(product, allProducts) {
    let available = product.stock || 0;

    if (product.packagingType === "single") {
      const bulkStock = allProducts
        .filter(
          (p) => p.parentProductId === product.id && p.packagingType === "bulk"
        )
        .reduce((total, bulk) => total + bulk.stock * bulk.piecesPerPackage, 0);

      available += bulkStock;
    }

    return available;
  }
}
