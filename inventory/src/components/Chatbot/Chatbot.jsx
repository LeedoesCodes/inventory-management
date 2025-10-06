import React, { useState, useEffect, useRef, useContext } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../../Firebase/firebase";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faTimes,
  faTrashAlt,
  faPaperPlane,
  faChartLine,
  faDatabase,
  faExchangeAlt,
  faLightbulb,
  faShoppingCart,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import "./Chatbot.scss";

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();

  // Apply theme to the entire chatbot overlay
  useEffect(() => {
    const chatbotOverlay = document.querySelector(".chatbot-overlay");
    if (chatbotOverlay) {
      chatbotOverlay.setAttribute("data-theme", theme);
    }
  }, [theme, isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Association Rules Functions
  const generateAssociationRules = (orders, thresholds = {}) => {
    if (!orders || orders.length === 0) {
      console.log("No orders provided to generate rules");
      return [];
    }

    // Use provided thresholds or defaults - EXACTLY like your hook
    const minSupport = thresholds.minSupport || 0.05;
    const minConfidence = thresholds.minConfidence || 0.3;
    const minLift = thresholds.minLift || 1.0;

    console.log(
      `Generating rules with thresholds: Support=${minSupport}, Confidence=${minConfidence}, Lift=${minLift}`
    );

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

      // Count pairs (items bought together) - EXACTLY like your hook
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i], items[j]].sort().join("|");
          pairCounts[pair] = (pairCounts[pair] || 1) + 1; // Use 1 as base to avoid division by zero
        }
      }
    });

    const rules = [];

    Object.entries(pairCounts).forEach(([pair, count]) => {
      const [itemA, itemB] = pair.split("|");
      const supportAB = count / totalOrders;
      const supportA = (itemCounts[itemA] || 1) / totalOrders;
      const supportB = (itemCounts[itemB] || 1) / totalOrders;

      // Calculate lift: lift(A → B) = support(A ∪ B) / (support(A) × support(B))
      const lift = supportAB / (supportA * supportB);

      // Rule: A → B - EXACTLY like your hook
      const confidenceAB = count / (itemCounts[itemA] || 1);
      if (
        confidenceAB >= minConfidence &&
        supportAB >= minSupport &&
        lift >= minLift
      ) {
        rules.push({
          antecedent: [itemA],
          consequent: [itemB],
          confidence: confidenceAB,
          support: supportAB,
          lift: lift,
          rule: `${itemA} → ${itemB}`,
        });
      }

      // Rule: B → A - EXACTLY like your hook
      const confidenceBA = count / (itemCounts[itemB] || 1);
      if (
        confidenceBA >= minConfidence &&
        supportAB >= minSupport &&
        lift >= minLift
      ) {
        rules.push({
          antecedent: [itemB],
          consequent: [itemA],
          confidence: confidenceBA,
          support: supportAB,
          lift: lift,
          rule: `${itemB} → ${itemA}`,
        });
      }
    });

    // CRITICAL FIX: Sort by confidence DESCENDING like your hook
    return rules.sort((a, b) => b.confidence - a.confidence);
  };

  const fetchAssociationRules = async () => {
    try {
      // Get recent orders to generate rules
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const allOrders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (allOrders.length === 0) {
        return {
          rules: [],
          totalOrders: 0,
          message: "No orders found to analyze",
        };
      }

      // Get user settings for thresholds
      const settingsSnapshot = await getDocs(collection(db, "userSettings"));
      const userSettings = settingsSnapshot.docs[0]?.data() || {
        minSupport: 0.05,
        minConfidence: 0.3,
        minLift: 1.0,
      };

      // Get recent orders (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentOrders = allOrders.filter((order) => {
        const orderDate =
          order.timestamp?.toDate?.() || order.timestamp || order.date;
        return orderDate ? new Date(orderDate) >= ninetyDaysAgo : true;
      });

      // Generate association rules
      const rules = generateAssociationRules(recentOrders, userSettings);

      return {
        rules: rules,
        totalOrders: recentOrders.length,
        thresholds: userSettings,
        generatedAt: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      console.error("Error fetching association rules:", error);
      return {
        rules: [],
        totalOrders: 0,
        error: "Failed to load recommendations",
      };
    }
  };

  // Helper function to determine rule strength - EXACTLY like your hook
  const getRuleStrength = (confidence, lift) => {
    // EXACTLY like your hook's getStrength function
    if (confidence >= 0.7 && lift >= 2.0) return "very high";
    if (confidence >= 0.7 && lift >= 1.5) return "high";
    if (confidence >= 0.5 && lift >= 1.2) return "medium";
    if (confidence >= 0.3 && lift >= 1.0) return "low";
    return "very low";
  };

  // Get lift interpretation text
  const getLiftInterpretation = (lift) => {
    const liftValue = lift || 0;
    if (liftValue > 3.0) return "Exceptional association 🚀";
    if (liftValue > 2.0) return "Strong positive association ✅";
    if (liftValue > 1.5) return "Positive association 👍";
    if (liftValue > 1.2) return "Moderate association 📈";
    if (liftValue > 1.0) return "Slight association ➕";
    if (liftValue === 1.0) return "Independent items ➖";
    return "Negative association ❌";
  };

  // Generate recommendation insights
  const generateRecommendationInsights = (recommendations) => {
    if (recommendations.length === 0)
      return "• No strong patterns detected yet";

    const insights = [
      "• **Create product bundles** for frequently bought together items",
      "• **Strategic product placement** near each other in store layout",
      "• **Cross-promote** these items in marketing campaigns",
      "• **Monitor inventory** for these high-association products",
      "• **Create combo deals** to increase average order value",
    ];

    // Add specific insights based on strongest recommendation
    const strongestRec = recommendations[0];
    if (strongestRec.confidence > 0.7) {
      insights.push(
        `• **Priority Focus:** ${strongestRec.antecedent[0]} and ${strongestRec.consequent[0]} - your strongest product relationship`
      );
    }

    // Add insights based on lift
    const highLiftRecs = recommendations.filter((rec) => rec.lift > 2.0);
    if (highLiftRecs.length > 0) {
      insights.push(
        `• **High-Impact Opportunities:** ${highLiftRecs.length} relationships with exceptional lift values`
      );
    }

    return insights.join("\n");
  };

  // Get popular items like dashboard
  const getPopularItems = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map((doc) => doc.data());

      const itemCounts = {};
      orders.forEach((order) => {
        order.items?.forEach((item) => {
          const itemName =
            item.name || item.productName || item.itemName || "Unknown Item";
          itemCounts[itemName] =
            (itemCounts[itemName] || 0) + (item.quantity || 1);
        });
      });

      const popularItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sold]) => ({ name, sold }));

      return popularItems;
    } catch (error) {
      console.error("Error getting popular items:", error);
      return [];
    }
  };

  // Manual analysis for recommendations - MATCHES DASHBOARD EXACTLY
  const analyzeRecommendationsManually = async (associationData, userInput) => {
    const { rules, totalOrders, thresholds } = associationData;

    if (rules.length === 0) {
      return `**Product Association Analysis**\n\n*No association rules found based on ${totalOrders} recent orders.*\n\n**Current Thresholds:**\n• Support: ≥ ${(
        thresholds.minSupport * 100
      ).toFixed(1)}%\n• Confidence: ≥ ${(
        thresholds.minConfidence * 100
      ).toFixed(1)}%\n• Lift: ≥ ${thresholds.minLift.toFixed(
        2
      )}\n\n**Recommendations:**\n• Ensure you have sufficient order data with multiple items\n• The system needs more transaction history to identify patterns\n• Try lowering the thresholds in Settings if you have existing data`;
    }

    // Get popular items and generate recommendations like the dashboard
    const popularItems = await getPopularItems();
    const popularItemNames = popularItems.slice(0, 3).map((item) => item.name);

    // Use the same filtering logic as getRecommendations() in your hook
    const recommendations = rules
      .filter((rule) => {
        const antecedentMatch = rule.antecedent.every((item) =>
          popularItemNames.includes(item)
        );
        const consequentNotInCurrent = !rule.consequent.every((item) =>
          popularItemNames.includes(item)
        );
        return antecedentMatch && consequentNotInCurrent;
      })
      .slice(0, 5)
      .map((rule) => ({
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        confidence: rule.confidence,
        support: rule.support,
        lift: rule.lift,
        strength: getRuleStrength(rule.confidence, rule.lift),
      }));

    if (recommendations.length === 0) {
      return `**Smart Recommendations**\n\n*No recommendations generated based on popular items.*\n\n**Popular Items:**\n${popularItems
        .map(
          (item, index) => `${index + 1}. **${item.name}** - ${item.sold} sold`
        )
        .join("\n")}\n\n**Total Association Rules:** ${
        rules.length
      } rules found\n**Recommendation Conditions:**\n• Antecedent must match popular items\n• Consequent must NOT be in popular items`;
    }

    const rulesList = recommendations
      .map(
        (rec, index) =>
          `**${index + 1}. ${rec.antecedent[0]} → ${rec.consequent[0]}**\n` +
          `   • **Confidence:** ${(rec.confidence * 100).toFixed(1)}%\n` +
          `   • **Support:** ${(rec.support * 100).toFixed(
            1
          )}% of transactions\n` +
          `   • **Lift:** ${rec.lift.toFixed(2)} (${getLiftInterpretation(
            rec.lift
          )})\n` +
          `   • **Strength:** ${rec.strength} confidence`
      )
      .join("\n\n");

    const popularItemsList = popularItems
      .map(
        (item, index) => `${index + 1}. **${item.name}** - ${item.sold} sold`
      )
      .join("\n");

    return `**Smart Recommendations**\n\n*Based on popular items and ${totalOrders} transactions*\n\n**Popular Items Used:**\n${popularItemsList}\n\n**Generated Recommendations:**\n\n${rulesList}\n\n**Actionable Insights:**\n${generateRecommendationInsights(
      recommendations
    )}\n\n*Data updated: ${associationData.generatedAt}*`;
  };

  // Gemini AI Integration
  const queryWithGemini = async (userInput, businessContext) => {
    try {
      const functions = getFunctions();
      const geminiAnalysis = httpsCallable(functions, "geminiBusinessAnalysis");

      const result = await geminiAnalysis({
        userInput: userInput,
        businessContext: businessContext,
      });

      return result.data.response;
    } catch (error) {
      // Provide a response that actually analyzes the specific data
      return analyzeDataManually(userInput, businessContext);
    }
  };

  // Manual analysis as fallback - USES REAL DATA
  // Replace the analyzeDataManually function with this smarter version:
  const analyzeDataManually = async (userInput, businessContext) => {
    // Extract numbers from business context
    const customerMatch = businessContext.match(/Total Customers: (\d+)/);
    const orderMatch = businessContext.match(/Total Orders: (\d+)/);
    const revenueMatch = businessContext.match(/Total Revenue: ₱([\d.]+)/);
    const productsMatch = businessContext.match(/Total Products: (\d+)/);
    const lowStockMatch = businessContext.match(/Low Stock Items: (\d+)/);

    const totalCustomers = customerMatch ? parseInt(customerMatch[1]) : 0;
    const totalOrders = orderMatch ? parseInt(orderMatch[1]) : 0;
    const totalRevenue = revenueMatch ? parseFloat(revenueMatch[1]) : 0;
    const totalProducts = productsMatch ? parseInt(productsMatch[1]) : 0;
    const lowStockItems = lowStockMatch ? parseInt(lowStockMatch[1]) : 0;

    // Calculate key ratios for smarter insights
    const avgOrderValue = totalRevenue / (totalOrders || 1);
    const ordersPerCustomer = totalOrders / (totalCustomers || 1);
    const revenuePerCustomer = totalRevenue / (totalCustomers || 1);

    // Get additional data for deeper insights
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const orders = ordersSnapshot.docs.map((doc) => doc.data());

    // Calculate customer activity patterns
    const activeCustomers = [
      ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
    ].length;
    const repeatCustomers = orders.filter((order) => {
      const customerOrders = orders.filter(
        (o) => o.customerName === order.customerName
      );
      return customerOrders.length > 1;
    }).length;

    // Get popular products for specific recommendations
    const itemCounts = {};
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const itemName =
          item.name || item.productName || item.itemName || "Unknown Item";
        itemCounts[itemName] =
          (itemCounts[itemName] || 0) + (item.quantity || 1);
      });
    });

    const popularProducts = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, sold]) => ({ name, sold }));

    // Generate SPECIFIC insights based on YOUR data
    let specificInsights = [];
    let specificRecommendations = [];

    // Customer insights
    if (ordersPerCustomer > 5) {
      specificInsights.push(
        `• **Loyal Customer Base** - ${ordersPerCustomer.toFixed(
          1
        )} orders per customer indicates strong repeat business`
      );
      specificRecommendations.push(
        `• **Loyalty Program** - Reward your ${totalCustomers} frequent customers with exclusive offers`
      );
    } else if (ordersPerCustomer > 2) {
      specificInsights.push(
        `• **Growing Engagement** - ${ordersPerCustomer.toFixed(
          1
        )} orders per customer shows developing relationships`
      );
      specificRecommendations.push(
        `• **Upsell Strategy** - Encourage existing customers to increase order frequency`
      );
    } else {
      specificInsights.push(
        `• **Customer Acquisition Phase** - Focus on converting ${totalCustomers} registered customers to repeat buyers`
      );
      specificRecommendations.push(
        `• **First-time Buyer Incentives** - Convert one-time purchasers to regular customers`
      );
    }

    // Revenue insights
    if (avgOrderValue > 5000) {
      specificInsights.push(
        `• **High-Value Transactions** - ₱${avgOrderValue.toFixed(
          2
        )} average order value indicates premium purchasing`
      );
      specificRecommendations.push(
        `• **Premium Product Expansion** - Leverage high-value customer preferences`
      );
    } else if (avgOrderValue > 1000) {
      specificInsights.push(
        `• **Healthy Transaction Size** - ₱${avgOrderValue.toFixed(
          2
        )} average order value supports business sustainability`
      );
      specificRecommendations.push(
        `• **Bundle Opportunities** - Create product combinations to increase average order value`
      );
    }

    // Inventory insights
    if (lowStockItems === 0) {
      specificInsights.push(
        `• **Excellent Inventory Management** - All ${totalProducts} products are well-stocked`
      );
      specificRecommendations.push(
        `• **Inventory Optimization** - Maintain current stock levels while monitoring sales trends`
      );
    } else {
      specificInsights.push(
        `• **Proactive Restocking Needed** - ${lowStockItems} items require immediate attention`
      );
      specificRecommendations.push(
        `• **Priority Reordering** - Focus on the ${lowStockItems} low-stock products first`
      );
    }

    // Product performance insights
    if (popularProducts.length > 0) {
      specificInsights.push(
        `• **Clear Product Leaders** - Top sellers: ${popularProducts
          .map((p) => p.name)
          .join(", ")}`
      );
      specificRecommendations.push(
        `• **Featured Product Promotion** - Highlight your best-performing items in marketing`
      );
    }

    // Business scale insights
    if (totalOrders > 100) {
      specificInsights.push(
        `• **Established Business** - ${totalOrders} orders demonstrates market presence`
      );
      specificRecommendations.push(
        `• **Scale Operations** - Consider expanding product lines or services`
      );
    } else if (totalOrders > 50) {
      specificInsights.push(
        `• **Growth Trajectory** - ${totalOrders} orders shows positive business momentum`
      );
      specificRecommendations.push(
        `• **Customer Retention Focus** - Strengthen relationships with your ${activeCustomers} active customers`
      );
    }

    // If no specific insights were generated, use fallback
    if (specificInsights.length === 0) {
      specificInsights = [
        `• **Foundation Building** - ${totalOrders} orders across ${totalCustomers} customers provides a solid base`,
        `• **Revenue Generation** - ₱${totalRevenue.toFixed(
          2
        )} indicates active business operations`,
        `• **Product Diversity** - ${totalProducts} items offers good customer choice`,
      ];

      specificRecommendations = [
        `• **Customer Engagement** - Convert ${totalCustomers} registered customers to active buyers`,
        `• **Inventory Management** - Monitor ${
          lowStockItems > 0
            ? lowStockItems + " low-stock items"
            : "stock levels"
        }`,
        `• **Sales Optimization** - Analyze patterns in your ${totalOrders} transactions`,
      ];
    }

    return `**Business Intelligence Analysis**\n\n**Your Business Snapshot:**\n• **Customers:** ${totalCustomers} registered, ${activeCustomers} active\n• **Orders:** ${totalOrders} totaling ₱${totalRevenue.toFixed(
      2
    )}\n• **Products:** ${totalProducts} items, ${lowStockItems} low-stock\n• **Performance:** ₱${avgOrderValue.toFixed(
      2
    )} average order value\n\n**Specific Insights for Your Business:**\n${specificInsights.join(
      "\n"
    )}\n\n**Actionable Recommendations:**\n${specificRecommendations.join(
      "\n"
    )}\n\n*Analysis based on ${totalOrders} real transactions and ${totalProducts} products*`;
  };

  // Get comprehensive business context for Gemini
  const getBusinessContext = async () => {
    try {
      const [customersSnapshot, ordersSnapshot, productsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "customers")),
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
        ]);

      const customers = customersSnapshot.docs.map((doc) => doc.data());
      const orders = ordersSnapshot.docs.map((doc) => doc.data());
      const products = productsSnapshot.docs.map((doc) => doc.data());

      // Calculate key metrics for context
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );
      const totalCustomers = customers.length;
      const totalProducts = products.length;
      const lowStockProducts = products.filter(
        (p) => (p.stock || 0) <= 10
      ).length;

      // Get recent activity
      const recentOrders = orders
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        )
        .slice(0, 3);

      return `
        BUSINESS SNAPSHOT:
        - Total Customers: ${totalCustomers}
        - Total Orders: ${orders.length}
        - Total Revenue: ₱${totalRevenue.toFixed(2)}
        - Total Products: ${totalProducts}
        - Low Stock Items: ${lowStockProducts}
        
        RECENT ACTIVITY:
        ${recentOrders
          .map(
            (order) =>
              `- ${order.customerName} ordered ₱${(
                order.totalAmount || 0
              ).toFixed(2)} on ${
                order.createdAt?.toDate?.().toLocaleDateString() || "Unknown"
              }`
          )
          .join("\n")}
        
        KEY METRICS:
        - Average Order Value: ₱${(totalRevenue / (orders.length || 1)).toFixed(
          2
        )}
        - Inventory Value: ₱${products
          .reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0)
          .toFixed(2)}
      `;
    } catch (error) {
      return "Business data unavailable.";
    }
  };

  // Intelligent query router - decides when to use AI vs traditional queries
  const intelligentQueryRouter = async (userInput) => {
    const input = userInput.toLowerCase().trim();

    // Questions that should use traditional queries (structured data)
    const traditionalQueryPatterns = [
      "how many",
      "count",
      "total",
      "list",
      "show me",
      "recent",
      "top spending",
      "low stock",
      "today",
      "revenue",
      "orders",
      "customers",
      "products",
      "inventory",
    ];

    // Questions that should use AI (analysis, insights, complex questions)
    const aiQueryPatterns = [
      "analyze",
      "insight",
      "trend",
      "pattern",
      "why",
      "how should",
      "recommend",
      "suggest",
      "what if",
      "predict",
      "compare",
      "business health",
      "performance",
      "improve",
      "optimize",
      "advice",
      "strategy",
      "opportunity",
      "association",
      "product recommendation",
      "what products",
      "bundle",
      "cross-sell",
      "upsell",
      "frequently bought",
      "customers also buy",
      "product relationships",
    ];

    const isTraditionalQuery = traditionalQueryPatterns.some((pattern) =>
      input.includes(pattern)
    );

    const isAIQuery = aiQueryPatterns.some((pattern) =>
      input.includes(pattern)
    );

    // Use AI for analytical questions, traditional for data lookup
    if (isAIQuery || (!isTraditionalQuery && input.length > 15)) {
      const businessContext = await getBusinessContext();

      // If it's specifically about recommendations, fetch real-time data first
      if (
        input.includes("association") ||
        input.includes("recommend") ||
        input.includes("bundle") ||
        input.includes("cross-sell") ||
        input.includes("frequently") ||
        input.includes("product relationship") ||
        input.includes("customers also")
      ) {
        const associationData = await fetchAssociationRules();
        const enhancedContext = `${businessContext}\n\nASSOCIATION RULES DATA:\n${JSON.stringify(
          associationData,
          null,
          2
        )}`;
        const aiResponse = await queryWithGemini(userInput, enhancedContext);

        if (aiResponse) {
          return aiResponse;
        }
        // If AI fails, fall back to manual analysis with real data
        return await analyzeRecommendationsManually(associationData, userInput);
      }

      const aiResponse = await queryWithGemini(userInput, businessContext);
      if (aiResponse) {
        return aiResponse;
      }
    }

    return null;
  };

  // Calculate top customers from orders (more reliable)
  const calculateTopCustomersFromOrders = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const customerStats = {};

      orders.forEach((order) => {
        const customerName = order.customerName;
        if (!customerName) return;

        if (!customerStats[customerName]) {
          customerStats[customerName] = {
            totalSpent: 0,
            orderCount: 0,
            lastOrder: null,
          };
        }

        customerStats[customerName].totalSpent += order.totalAmount || 0;
        customerStats[customerName].orderCount += 1;

        const orderDate = order.createdAt?.toDate?.() || new Date();
        if (
          !customerStats[customerName].lastOrder ||
          orderDate > customerStats[customerName].lastOrder
        ) {
          customerStats[customerName].lastOrder = orderDate;
        }
      });

      const topCustomers = Object.entries(customerStats)
        .map(([name, stats]) => ({
          name,
          totalSpent: stats.totalSpent,
          orderCount: stats.orderCount,
          lastOrder: stats.lastOrder,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      if (topCustomers.length === 0) {
        return "**Top Spending Customers**\n\nNo orders found in the system.";
      }

      const customerList = topCustomers
        .map(
          (c, index) =>
            `${index + 1}. **${c.name}** - ₱${c.totalSpent.toFixed(
              2
            )} spent - ${c.orderCount} orders - Last: ${
              c.lastOrder?.toLocaleDateString() || "Unknown"
            }`
        )
        .join("\n");

      return `**Top Spending Customers**\n\n*Calculated from actual orders data*\n\n${customerList}`;
    } catch (error) {
      return "Sorry, I couldn't calculate customer spending from orders.";
    }
  };

  // Query customers with markdown formatting
  const queryCustomers = async (intent) => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customers = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (intent === "count") {
        // Calculate REAL totals from orders collection instead of customer documents
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const orders = ordersSnapshot.docs.map((doc) => doc.data());

        // Calculate real totals from orders
        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const totalItemsSold = orders.reduce(
          (sum, order) => sum + (order.totalItems || 0),
          0
        );

        // Count unique customers who actually placed orders
        const customersWithOrders = [
          ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
        ];

        return (
          `**Customer Overview**\n\n` +
          `**Total Registered Customers:** ${customers.length}\n` +
          `**Active Customers (Placed Orders):** ${customersWithOrders.length}\n` +
          `**Total Orders Processed:** ${orders.length}\n` +
          `**Total Revenue Generated:** ₱${totalRevenue.toFixed(2)}\n` +
          `**Total Items Sold:** ${totalItemsSold}\n` +
          `**Average Orders per Customer:** ${(
            orders.length / (customersWithOrders.length || 1)
          ).toFixed(1)}`
        );
      } else if (intent === "recent") {
        const recentCustomers = customers
          .sort((a, b) => {
            const dateA = a.createdAT?.toMillis?.() || 0;
            const dateB = b.createdAT?.toMillis?.() || 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        if (recentCustomers.length === 0) {
          return "**Recent Customers**\n\nNo customers found.";
        }

        const customerList = recentCustomers
          .map(
            (c) =>
              `• **${c.name}** - ${c.phone || "No phone"} - Joined: ${
                c.createdAT?.toDate?.().toLocaleDateString() || "Unknown"
              }`
          )
          .join("\n");

        return `**Recent Customers**\n\n${customerList}`;
      } else if (intent === "top") {
        // For top customers, use the orders-based calculation which is more accurate
        return await calculateTopCustomersFromOrders();
      }
    } catch (error) {
      return "Sorry, I couldn't retrieve customer data at the moment.";
    }
  };

  // Query orders with markdown formatting
  const queryOrders = async (intent) => {
    try {
      const ordersSnapshot = await getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"))
      );
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (intent === "count") {
        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const avgOrderValue = totalRevenue / (orders.length || 1);
        const uniqueCustomers = [
          ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
        ];

        return (
          `**Order Overview**\n\n` +
          `**Total Orders:** ${orders.length}\n` +
          `**Unique Customers Served:** ${uniqueCustomers.length}\n` +
          `**Total Revenue:** ₱${totalRevenue.toFixed(2)}\n` +
          `**Average Order Value:** ₱${avgOrderValue.toFixed(2)}\n` +
          `**Total Items Sold:** ${orders.reduce(
            (sum, order) => sum + (order.totalItems || 0),
            0
          )}`
        );
      } else if (intent === "recent") {
        const recentOrders = orders.slice(0, 5);

        if (recentOrders.length === 0) {
          return "**Recent Orders**\n\nNo orders found.";
        }

        const orderList = recentOrders
          .map(
            (o) =>
              `• **${o.customerName}** - ₱${(o.totalAmount || 0).toFixed(
                2
              )} - ${o.totalItems || 0} items - ${
                o.createdAt?.toDate?.().toLocaleDateString() || "Unknown"
              }`
          )
          .join("\n");

        return `**Recent Orders**\n\n${orderList}`;
      } else if (intent === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter((o) => {
          const orderDate = o.createdAt?.toDate();
          return orderDate >= today;
        });
        const todayRevenue = todayOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const todayItems = todayOrders.reduce(
          (sum, order) => sum + (order.totalItems || 0),
          0
        );
        const todayCustomers = [
          ...new Set(
            todayOrders.map((order) => order.customerName).filter(Boolean)
          ),
        ];

        return (
          `**Today's Performance**\n\n` +
          `**Orders Today:** ${todayOrders.length}\n` +
          `**Customers Served Today:** ${todayCustomers.length}\n` +
          `**Today's Revenue:** ₱${todayRevenue.toFixed(2)}\n` +
          `**Items Sold Today:** ${todayItems}\n` +
          `**Average Order Today:** ₱${(
            todayRevenue / (todayOrders.length || 1)
          ).toFixed(2)}`
        );
      }
    } catch (error) {
      return "Sorry, I couldn't retrieve order data at the moment.";
    }
  };

  // Query products with markdown formatting
  const queryProducts = async (intent) => {
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (intent === "count") {
        const categories = [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ];
        const totalValue = products.reduce(
          (sum, p) => sum + (p.price || 0) * (p.stock || 0),
          0
        );

        return (
          `**Product Overview**\n\n` +
          `**Total Products:** ${products.length}\n` +
          `**Categories:** ${categories.length}\n` +
          `**Inventory Value:** ₱${totalValue.toFixed(2)}\n` +
          `**Average Stock:** ${(
            products.reduce((sum, p) => sum + (p.stock || 0), 0) /
            products.length
          ).toFixed(0)} units`
        );
      } else if (intent === "lowstock") {
        const settingsSnapshot = await getDocs(collection(db, "userSettings"));
        const lowStockThreshold =
          settingsSnapshot.docs[0]?.data()?.lowStockThreshold || 10;

        const lowStockProducts = products
          .filter((p) => (p.stock || 0) <= lowStockThreshold)
          .sort((a, b) => (a.stock || 0) - (b.stock || 0));

        if (lowStockProducts.length === 0) {
          return `**Stock Status**\n\nAll products are well-stocked. No products below ${lowStockThreshold} units.`;
        }

        const productList = lowStockProducts
          .map((p) => {
            const stockLevel = p.stock || 0;
            let priority = "";
            if (stockLevel === 0) priority = "[OUT OF STOCK] ";
            else if (stockLevel <= 5) priority = "[LOW STOCK] ";

            return `• ${priority}**${p.name}** - ${stockLevel} units - ₱${
              p.price || 0
            } - ${p.category || "Uncategorized"}`;
          })
          .join("\n");

        return `**Low Stock Alert**\n\n**Threshold:** ${lowStockThreshold} units\n**Items Needing Attention:** ${lowStockProducts.length}\n\n${productList}`;
      } else if (intent === "categories") {
        const categories = [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ];
        const categorySummary = categories
          .map((category) => {
            const categoryProducts = products.filter(
              (p) => p.category === category
            );
            const totalStock = categoryProducts.reduce(
              (sum, p) => sum + (p.stock || 0),
              0
            );
            const totalValue = categoryProducts.reduce(
              (sum, p) => sum + (p.price || 0) * (p.stock || 0),
              0
            );

            return `• **${category}** - ${
              categoryProducts.length
            } products - ${totalStock} units - ₱${totalValue.toFixed(2)} value`;
          })
          .join("\n");

        return `**Product Categories**\n\n${categorySummary}`;
      }
    } catch (error) {
      return "Sorry, I couldn't retrieve product data at the moment.";
    }
  };

  // Query users with markdown formatting
  const queryUsers = async (intent) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (intent === "count") {
        const roles = users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});

        const roleSummary = Object.entries(roles)
          .map(
            ([role, count]) =>
              `• **${role.charAt(0).toUpperCase() + role.slice(1)}:** ${count}`
          )
          .join("\n");

        return `**User Overview**\n\n**Total Users:** ${users.length}\n\n${roleSummary}`;
      } else if (intent === "employees") {
        const employees = users.filter(
          (u) =>
            u.role === "employee" || u.role === "admin" || u.role === "owner"
        );

        const employeeList = employees
          .map((u) => {
            const status = u.approvedAt ? "Active" : "Pending";
            return `• **${u.displayName || "No Name"}** - ${u.email} - ${
              u.role
            } - ${status} - Joined: ${
              u.createdAt?.toDate?.().toLocaleDateString() || "Unknown"
            }`;
          })
          .join("\n");

        return `**Team Members**\n\n${employeeList}`;
      }
    } catch (error) {
      return "Sorry, I couldn't retrieve user data at the moment.";
    }
  };

  // Handle traditional queries
  const handleTraditionalQueries = async (input) => {
    let response =
      "I'm not sure how to help with that. Try asking about customers, orders, products, or users.";

    // Greetings
    if (
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey") ||
      input.includes("greetings")
    ) {
      response =
        "Hello! I'm your **Hybrid Business Assistant**. I combine **AI intelligence** with **real business data**!\n\n**AI Analysis** - Trends, insights, recommendations\n**Data Queries** - Customers, orders, products, sales\n**Emerging Technology** - Hybrid AI + Data system\n\nWhat would you like to know?";
    }

    // Thanks and appreciation
    else if (
      input.includes("thank") ||
      input.includes("thanks") ||
      input.includes("appreciate") ||
      input.includes("good job") ||
      input.includes("well done")
    ) {
      response =
        "You're welcome! Happy to help. Is there anything else you'd like to know about your business?";
    }

    // Goodbye
    else if (
      input.includes("bye") ||
      input.includes("goodbye") ||
      input.includes("see you") ||
      input.includes("farewell")
    ) {
      response =
        "Goodbye! Feel free to ask if you need any more business insights!";
    }

    // How are you
    else if (
      input.includes("how are you") ||
      input.includes("how's it going") ||
      input.includes("what's up")
    ) {
      response =
        "I'm doing great! As a **hybrid AI assistant**, I can use both **data queries** and **AI analysis** to help you. What can I assist with today?";
    }

    // Help - Updated to show hybrid capabilities
    else if (input.includes("help") || input.includes("what can you do")) {
      response = `**Hybrid Business Assistant**\n\n**EMERGING TECHNOLOGY FEATURES:**\n• **Intelligent Query Routing** - AI decides the best approach\n• **Google Gemini Integration** - Cutting-edge AI\n• **Real-time Business Context** - AI understands your data\n• **Hybrid Intelligence** - Combines AI + structured data\n\n**AI ANALYSIS**\n• "Analyze sales trends"\n• "Business performance insights"\n• "Recommend improvements"\n• "Identify patterns"\n• "Compare performance"\n\n**DATA QUERIES**\n• Customer counts & analytics\n• Order history & revenue\n• Product inventory & stock\n• Team members & users\n• Sales performance\n\n**BUSINESS INTELLIGENCE**\n• Combined AI + data insights\n• Real-time analytics\n• Predictive suggestions`;
    }

    // Customer queries
    else if (input.includes("customer")) {
      if (
        input.includes("how many") ||
        input.includes("count") ||
        input.includes("total")
      ) {
        response = await queryCustomers("count");
      } else if (input.includes("recent") || input.includes("new")) {
        response = await queryCustomers("recent");
      } else if (
        input.includes("top") ||
        input.includes("spend") ||
        input.includes("best") ||
        input.includes("highest")
      ) {
        response = await queryCustomers("top");
      } else {
        response = await queryCustomers("count");
      }
    }

    // Order queries
    else if (input.includes("order") || input.includes("sale")) {
      if (input.includes("today") || input.includes("this day")) {
        response = await queryOrders("today");
      } else if (input.includes("recent") || input.includes("latest")) {
        response = await queryOrders("recent");
      } else if (
        input.includes("how many") ||
        input.includes("count") ||
        input.includes("total")
      ) {
        response = await queryOrders("count");
      } else {
        response = await queryOrders("count");
      }
    }

    // Product queries
    else if (
      input.includes("product") ||
      input.includes("inventory") ||
      input.includes("stock") ||
      input.includes("item")
    ) {
      if (
        input.includes("low") ||
        input.includes("out of") ||
        input.includes("need restock") ||
        input.includes("running out")
      ) {
        response = await queryProducts("lowstock");
      } else if (input.includes("categor")) {
        response = await queryProducts("categories");
      } else if (
        input.includes("how many") ||
        input.includes("count") ||
        input.includes("total")
      ) {
        response = await queryProducts("count");
      } else {
        response = await queryProducts("count");
      }
    }

    // User queries
    else if (
      input.includes("user") ||
      input.includes("team") ||
      input.includes("employee") ||
      input.includes("staff")
    ) {
      if (
        input.includes("team") ||
        input.includes("employee") ||
        input.includes("staff")
      ) {
        response = await queryUsers("employees");
      } else if (
        input.includes("how many") ||
        input.includes("count") ||
        input.includes("total")
      ) {
        response = await queryUsers("count");
      } else {
        response = await queryUsers("count");
      }
    }

    // Sales/revenue
    else if (
      input.includes("revenue") ||
      input.includes("income") ||
      input.includes("money") ||
      input.includes("performance") ||
      input.includes("sales") ||
      input.includes("profit")
    ) {
      if (input.includes("today")) {
        response = await queryOrders("today");
      } else {
        response = await queryOrders("count");
      }
    }

    // Business overview
    else if (
      input.includes("overview") ||
      input.includes("summary") ||
      input.includes("dashboard") ||
      (input.includes("business") &&
        (input.includes("how") ||
          input.includes("status") ||
          input.includes("doing")))
    ) {
      const customerSummary = await queryCustomers("count");
      const orderSummary = await queryOrders("count");
      const productSummary = await queryProducts("count");

      response = `**Business Overview**\n\n${customerSummary}\n\n${orderSummary}\n\n${productSummary}`;
    }

    // Product recommendations and associations
    else if (
      input.includes("association") ||
      input.includes("recommend") ||
      input.includes("bundle") ||
      input.includes("cross-sell") ||
      input.includes("frequently") ||
      input.includes("product relationship") ||
      input.includes("customers also")
    ) {
      const associationData = await fetchAssociationRules();
      response = await analyzeRecommendationsManually(associationData, input);
    }

    // AI capabilities showcase
    else if (
      input.includes("ai") ||
      input.includes("gemini") ||
      input.includes("intelligent")
    ) {
      response =
        'I\'m a **hybrid AI assistant**! I combine **Google Gemini AI** with your **real business data**. This is **emerging technology**!\n\nTry asking:\n\n• "Analyze my sales trends"\n• "What business insights can you provide?"\n• "Recommend ways to improve performance"\n• "Identify patterns in customer behavior"';
    }

    return response;
  };

  // Enhanced Main command processor with AI integration
  const processCommand = async (userInput) => {
    const input = userInput.toLowerCase().trim();

    // Add user message to local state immediately
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;

      // First, try AI for complex queries
      const aiResponse = await intelligentQueryRouter(userInput);
      if (aiResponse) {
        response = aiResponse;
      }
      // If AI didn't handle it, use traditional queries
      else {
        response = await handleTraditionalQueries(input);
      }

      // Add bot response to local state
      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Send message function
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await processCommand(input);
    setInput("");
  };

  const clearChat = async () => {
    setMessages([]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <FontAwesomeIcon icon={faRobot} className="chatbot-icon" />
            <h3>Hybrid Business Assistant</h3>
          </div>
          <div className="chatbot-actions">
            <button
              onClick={clearChat}
              className="clear-btn"
              disabled={loading}
              title="Clear chat"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
            <button onClick={onClose} className="close-btn" title="Close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && !loading ? (
            <div className="welcome-message">
              <div className="welcome-header">
                <h3>
                  <FontAwesomeIcon icon={faRobot} /> Hybrid Business Assistant
                </h3>
                <p>
                  <strong>Emerging Technology Demo</strong>
                </p>
                <div className="welcome-features">
                  <div>
                    <FontAwesomeIcon icon={faChartLine} /> AI Analysis &
                    Insights
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faDatabase} /> Data Queries &
                    Analytics
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faExchangeAlt} /> Intelligent Routing
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faLightbulb} /> Business Intelligence
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faShoppingCart} /> Product
                    Recommendations
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faLink} /> Association Rules
                  </div>
                </div>

                <div>• "Analyze my business performance" (AI)</div>
                <div>• "Top spending customers" (Data)</div>
                <div>• "Product recommendations" (AI + Data)</div>
                <div>• "Low stock products" (Data)</div>
                <div>• "Customer buying patterns" (AI)</div>
                <div>• "Association rules analysis" (Real-time Data)</div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </>
          )}
          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about product recommendations, business data, or request AI analysis..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="send-btn"
            title="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
