// components/products/PackagingHistory.jsx
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

export default function PackagingHistory() {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversions();
  }, []);

  const fetchConversions = async () => {
    try {
      const q = query(
        collection(db, "packagingConversions"),
        orderBy("convertedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const conversionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversions(conversionsData);
    } catch (error) {
      console.error("Error fetching conversions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp.toDate()).toLocaleString();
  };

  if (loading) return <div>Loading conversion history...</div>;

  return (
    <div className="packaging-history">
      <h3>Packaging Conversion History</h3>

      {conversions.length === 0 ? (
        <p>No conversion history found.</p>
      ) : (
        <div className="conversions-list">
          {conversions.map((conversion) => (
            <div key={conversion.id} className="conversion-item">
              <div className="conversion-type">
                {conversion.type === "break_bulk"
                  ? "🔓 Broke Bulk"
                  : "📦 Created Bulk"}
              </div>

              <div className="conversion-details">
                {conversion.type === "break_bulk" ? (
                  <>
                    <span>Broke {conversion.packagesBroken} packages</span>
                    <span>→ Created {conversion.piecesCreated} pieces</span>
                  </>
                ) : (
                  <>
                    <span>Used {conversion.piecesUsed} pieces</span>
                    <span>→ Created {conversion.packagesCreated} packages</span>
                  </>
                )}
              </div>

              <div className="conversion-date">
                {formatDate(conversion.convertedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
