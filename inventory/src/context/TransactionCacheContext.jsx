import React, { createContext, useContext, useState, useCallback } from "react";

// Context for caching transaction data across page navigations
const TransactionCacheContext = createContext();

export const TransactionCacheProvider = ({ children }) => {
  const [cachedOrders, setCachedOrders] = useState(null);
  const [cachedProducts, setCachedProducts] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const setCacheData = useCallback((orders, products) => {
    setCachedOrders(orders);
    setCachedProducts(products);
    setCacheTimestamp(Date.now());
    setIsStale(false);
  }, []);

  const getCacheData = useCallback(() => {
    if (!cachedOrders || !cachedProducts) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cacheTimestamp > CACHE_DURATION;

    if (isExpired) {
      setIsStale(true);
      return null;
    }

    return { orders: cachedOrders, products: cachedProducts };
  }, [cachedOrders, cachedProducts, cacheTimestamp]);

  const clearCache = useCallback(() => {
    setCachedOrders(null);
    setCachedProducts(null);
    setCacheTimestamp(null);
    setIsStale(false);
  }, []);

  const markAsStale = useCallback(() => {
    setIsStale(true);
  }, []);

  return (
    <TransactionCacheContext.Provider
      value={{
        getCacheData,
        setCacheData,
        clearCache,
        markAsStale,
        isStale,
        hasCachedData: !!cachedOrders && !!cachedProducts,
      }}
    >
      {children}
    </TransactionCacheContext.Provider>
  );
};

export const useTransactionCache = () => {
  const context = useContext(TransactionCacheContext);
  if (!context) {
    throw new Error(
      "useTransactionCache must be used within TransactionCacheProvider",
    );
  }
  return context;
};
