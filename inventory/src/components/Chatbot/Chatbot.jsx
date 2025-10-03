import React, { useState, useEffect, useRef, useContext } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ReactMarkdown from "react-markdown";
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

  // Debug function to check customer data
  const debugCustomerData = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customers = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("🔍 DEBUG - Customer Data Structure:");
      customers.forEach((customer, index) => {
        console.log(`Customer ${index + 1}:`, {
          name: customer.name,
          TotalSpent: customer.TotalSpent,
          TotalOrders: customer.TotalOrders,
          lastOrderDate: customer.lastOrderDate,
          createdAT: customer.createdAT,
          dataTypes: {
            TotalSpent: typeof customer.TotalSpent,
            TotalOrders: typeof customer.TotalOrders,
            lastOrderDate: typeof customer.lastOrderDate,
          },
        });
      });

      // Also check if there are any orders for these customers
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📦 Orders data sample:", orders.slice(0, 3));
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  // Calculate top customers from orders (more reliable)
  const calculateTopCustomersFromOrders = async () => {
    try {
      console.log("🔍 Calculating top customers from orders...");
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

      console.log("📊 Calculated top customers from orders:", topCustomers);

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
      console.error("Error calculating from orders:", error);
      return "Sorry, I couldn't calculate customer spending from orders.";
    }
  };

  // Query customers with markdown formatting
  const queryCustomers = async (intent) => {
    try {
      console.log("🔍 Querying customers collection");
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customers = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📊 Raw customers data:", customers);

      if (intent === "count") {
        const totalSpent = customers.reduce(
          (sum, c) => sum + (c.TotalSpent || 0),
          0
        );
        const totalOrders = customers.reduce(
          (sum, c) => sum + (c.TotalOrders || 0),
          0
        );

        return (
          `**Customer Overview**\n\n` +
          `**Total Customers:** ${customers.length}\n` +
          `**Total Orders:** ${totalOrders}\n` +
          `**Total Customer Value:** ₱${totalSpent.toFixed(2)}\n` +
          `**Average Orders per Customer:** ${(
            totalOrders / customers.length || 0
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
      console.error("❌ Error querying customers:", error);
      return "Sorry, I couldn't retrieve customer data at the moment.";
    }
  };

  // Query orders with markdown formatting
  const queryOrders = async (intent) => {
    try {
      console.log("🔍 Querying orders collection");
      const ordersSnapshot = await getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"))
      );
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📦 Orders found:", orders.length);

      if (intent === "count") {
        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const avgOrderValue = totalRevenue / (orders.length || 1);

        return (
          `**Order Overview**\n\n` +
          `**Total Orders:** ${orders.length}\n` +
          `**Total Revenue:** ₱${totalRevenue.toFixed(2)}\n` +
          `**Average Order Value:** ₱${avgOrderValue.toFixed(2)}\n` +
          `**Total Items Sold:** ${orders.reduce(
            (sum, order) => sum + (order.totalItems || 0),
            0
          )}`
        );
      } else if (intent === "recent") {
        const recentOrders = orders.slice(0, 5);

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

        return (
          `**Today's Performance**\n\n` +
          `**Orders Today:** ${todayOrders.length}\n` +
          `**Today's Revenue:** ₱${todayRevenue.toFixed(2)}\n` +
          `**Items Sold Today:** ${todayItems}\n` +
          `**Average Order Today:** ₱${(
            todayRevenue / (todayOrders.length || 1)
          ).toFixed(2)}`
        );
      }
    } catch (error) {
      console.error("❌ Error querying orders:", error);
      return "Sorry, I couldn't retrieve order data at the moment.";
    }
  };

  // Query products with markdown formatting
  const queryProducts = async (intent) => {
    try {
      console.log("🔍 Querying products collection");
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📋 Products found:", products.length);

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
      console.error("❌ Error querying products:", error);
      return "Sorry, I couldn't retrieve product data at the moment.";
    }
  };

  // Query users with markdown formatting
  const queryUsers = async (intent) => {
    try {
      console.log("🔍 Querying users collection");
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("👥 Users found:", users.length);

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
      console.error("❌ Error querying users:", error);
      return "Sorry, I couldn't retrieve user data at the moment.";
    }
  };

  // Main command processor
  const processCommand = async (userInput) => {
    const input = userInput.toLowerCase().trim();
    console.log("🎯 Processing command:", userInput);

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
          "Hello! 👋 I can help you query your business data. Ask me about:\n\n**Customers** - counts, recent, top spenders\n**Orders** - today's sales, recent orders\n**Products** - stock levels, categories\n**Users** - team members, user counts\n**Sales** - revenue, performance";
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
          "You're welcome! 😊 Happy to help. Is there anything else you'd like to know about your business data?";
      }

      // Goodbye
      else if (
        input.includes("bye") ||
        input.includes("goodbye") ||
        input.includes("see you") ||
        input.includes("farewell")
      ) {
        response =
          "Goodbye! 👋 Feel free to ask if you need any more business insights!";
      }

      // How are you
      else if (
        input.includes("how are you") ||
        input.includes("how's it going") ||
        input.includes("what's up")
      ) {
        response =
          "I'm doing great! Ready to help you analyze your business data. What can I assist you with today?";
      }

      // Help
      else if (input.includes("help") || input.includes("what can you do")) {
        response = `**Available Commands**\n\n**CUSTOMERS**\n• How many customers?\n• Recent customers\n• Top spending customers\n• Customer count\n\n**ORDERS**\n• Total orders\n• Today's orders\n• Recent orders\n• Sales today\n• Revenue\n\n**PRODUCTS**\n• Product count\n• Low stock items\n• Product categories\n• Inventory status\n• Stock levels\n\n**USERS**\n• User count\n• Team members\n• Employee list\n• Staff\n\n**SALES**\n• Today's revenue\n• Sales overview\n• Business performance\n• Income`;
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

      // Debug command (hidden from users)
      else if (input.includes("debug") && input.includes("customer")) {
        await debugCustomerData();
        response = "Check the browser console for customer data details.";
      }

      console.log("🤖 Bot response:", response);

      // Add bot response to local state
      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Error processing command:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Sorry, I encountered an error accessing the database. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Send message function - THIS WAS MISSING
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    console.log("📤 Sending message:", input);
    await processCommand(input);
    setInput("");
  };

  const clearChat = async () => {
    console.log("🗑️ Clearing chat");
    setMessages([]);
    setLoading(false);
  };

  // Debug on open
  useEffect(() => {
    if (isOpen) {
      debugCustomerData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <h3>Business Assistant</h3>
          </div>
          <div className="chatbot-actions">
            <button
              onClick={clearChat}
              className="clear-btn"
              disabled={loading}
            >
              🗑️ Clear
            </button>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && !loading ? (
            <div className="welcome-message">
              <div className="welcome-header">
                <h3>🤖 Business Assistant</h3>
                <p>
                  <strong>I can help you with:</strong>
                </p>
                <div className="welcome-features">
                  <div>📊 Customers & Analytics</div>
                  <div>🛒 Orders & Sales</div>
                  <div>📦 Products & Inventory</div>
                  <div>👥 Users & Team</div>
                  <div>💰 Revenue & Performance</div>
                </div>
                <p>
                  <em>Try asking:</em>
                </p>
                <div>• "How many orders today?"</div>
                <div>• "Show low stock products"</div>
                <div>• "Top spending customers"</div>
                <div>• "Business overview"</div>
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
            placeholder="Ask about your business data..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="send-btn"
          >
            📤 Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
