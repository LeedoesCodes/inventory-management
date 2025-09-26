import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";

// Enhanced client-side association rules algorithm with lift calculation
const generateAssociationRules = (orders) => {
  if (!orders || orders.length === 0) {
    console.log("No orders provided to generate rules");
    return [];
  }

  console.log("Generating rules from orders:", orders.length); // DEBUG

  const pairCounts = {};
  const itemCounts = {};
  const totalOrders = orders.length;

  orders.forEach((order) => {
    // Extract item names from orders - handle different possible field names
    const items =
      order.items
        ?.map((item) => {
          return (
            item.name || item.productName || item.itemName || "Unknown Item"
          );
        })
        .filter((item) => item !== "Unknown Item") || [];

    // Count individual items
    items.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    // Count pairs (items bought together)
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pair = [items[i], items[j]].sort().join("|");
        pairCounts[pair] = (pairCounts[pair] || 1) + 1; // Use 1 as base to avoid division by zero
      }
    }
  });

  console.log("Item counts:", itemCounts); // DEBUG
  console.log("Pair counts:", pairCounts); // DEBUG

  const rules = [];

  Object.entries(pairCounts).forEach(([pair, count]) => {
    const [itemA, itemB] = pair.split("|");
    const supportAB = count / totalOrders;
    const supportA = (itemCounts[itemA] || 1) / totalOrders;
    const supportB = (itemCounts[itemB] || 1) / totalOrders;

    // Calculate lift: lift(A → B) = support(A ∪ B) / (support(A) × support(B))
    const lift = supportAB / (supportA * supportB);

    // Rule: A → B
    const confidenceAB = count / (itemCounts[itemA] || 1);
    if (confidenceAB > 0.3 && supportAB > 0.05) {
      rules.push({
        antecedent: [itemA],
        consequent: [itemB],
        confidence: confidenceAB,
        support: supportAB,
        lift: lift, // ADDED LIFT METRIC
        rule: `${itemA} → ${itemB}`,
      });
    }

    // Rule: B → A
    const confidenceBA = count / (itemCounts[itemB] || 1);
    if (confidenceBA > 0.3 && supportAB > 0.05) {
      rules.push({
        antecedent: [itemB],
        consequent: [itemA],
        confidence: confidenceBA,
        support: supportAB,
        lift: lift, // ADDED LIFT METRIC
        rule: `${itemB} → ${itemA}`,
      });
    }
  });

  console.log("Final generated rules with lift:", rules); // DEBUG
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

      console.log("Loading association rules from ORDERS collection...");

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const allOrders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("All orders from Firestore:", allOrders.length);

      if (allOrders.length === 0) {
        console.log("No orders found in database");
        setRules([]);
        return;
      }

      // Get recent orders (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentOrders = allOrders.filter((order) => {
        const orderDate =
          order.timestamp?.toDate?.() || order.timestamp || order.date;
        return orderDate ? new Date(orderDate) >= ninetyDaysAgo : true;
      });

      console.log("Recent orders (last 90 days):", recentOrders.length);

      const generatedRules = generateAssociationRules(recentOrders);
      console.log("Final rules generated:", generatedRules.length);
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
      if (!currentItems || currentItems.length === 0 || rules.length === 0) {
        console.log("No recommendations - conditions not met:", {
          currentItems,
          rulesCount: rules.length,
        });
        return [];
      }

      const recommendations = rules
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
          antecedent: rule.antecedent,
          consequent: rule.consequent,
          confidence: rule.confidence,
          support: rule.support,
          lift: rule.lift, // INCLUDING LIFT IN RECOMMENDATIONS
          strength: getStrength(rule.confidence, rule.lift),
          products: rule.consequent.map((itemName) => ({
            id: itemName,
            name: itemName,
          })),
          rule: rule.rule,
        }));

      console.log("Generated recommendations with lift:", recommendations);
      return recommendations;
    },
    [rules]
  );

  // Enhanced strength calculation considering both confidence and lift
  const getStrength = (confidence, lift) => {
    if (confidence >= 0.7 && lift >= 2.0) return "very high";
    if (confidence >= 0.7 && lift >= 1.5) return "high";
    if (confidence >= 0.5 && lift >= 1.2) return "medium";
    if (confidence >= 0.3 && lift >= 1.0) return "low";
    return "very low";
  };

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
