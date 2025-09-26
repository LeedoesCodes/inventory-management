import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";

// Simple client-side association rules algorithm
const generateAssociationRules = (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  const pairCounts = {};
  const itemCounts = {};

  transactions.forEach((transaction) => {
    const items =
      transaction.items?.map((item) => item.itemId || item.id || item.name) ||
      [];

    // Count individual items
    items.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    // Count pairs (items bought together)
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pair = [items[i], items[j]].sort().join("|");
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
      }
    }
  });

  const rules = [];
  const totalTransactions = transactions.length;

  Object.entries(pairCounts).forEach(([pair, count]) => {
    const [itemA, itemB] = pair.split("|");
    const support = count / totalTransactions;

    // Rule: A → B
    const confidenceAB = count / (itemCounts[itemA] || 1);
    if (confidenceAB > 0.3 && support > 0.05) {
      rules.push({
        antecedent: [itemA],
        consequent: [itemB],
        confidence: confidenceAB,
        support: support,
      });
    }

    // Rule: B → A
    const confidenceBA = count / (itemCounts[itemB] || 1);
    if (confidenceBA > 0.3 && support > 0.05) {
      rules.push({
        antecedent: [itemB],
        consequent: [itemA],
        confidence: confidenceBA,
        support: support,
      });
    }
  });

  return rules.sort((a, b) => b.confidence - a.confidence);
};

export const useAssociationRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get recent transactions (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const transactionsSnapshot = await getDocs(
        collection(db, "transactions")
      );
      const allTransactions = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const recentTransactions = allTransactions.filter((tx) => {
        const txDate = tx.timestamp?.toDate?.() || tx.timestamp;
        return new Date(txDate) >= ninetyDaysAgo;
      });

      if (recentTransactions.length === 0) {
        setRules([]);
        return;
      }

      const generatedRules = generateAssociationRules(recentTransactions);
      setRules(generatedRules);
    } catch (err) {
      console.error("Error loading association rules:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecommendations = useCallback(
    (currentItems) => {
      if (!currentItems || currentItems.length === 0 || rules.length === 0)
        return [];

      return rules
        .filter((rule) => {
          const antecedentMatch = rule.antecedent.every((item) =>
            currentItems.includes(item)
          );
          const consequentNotInCurrent = !rule.consequent.every((item) =>
            currentItems.includes(item)
          );
          return antecedentMatch && consequentNotInCurrent;
        })
        .slice(0, 5)
        .map((rule) => ({
          ...rule,
          strength:
            rule.confidence >= 0.7
              ? "high"
              : rule.confidence >= 0.4
              ? "medium"
              : "low",
        }));
    },
    [rules]
  );

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return {
    rules,
    loading,
    error,
    getRecommendations,
    refreshRules: loadRules,
  };
};
