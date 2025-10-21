// components/Customer/CustomerDiscountManager.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faTrash,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import "./CustomerDiscountManager.scss";

export default function CustomerDiscountManager({ customer, onClose }) {
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchCustomerDiscounts();
  }, [customer]);

  const fetchCategories = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      const uniqueCategories = [
        ...new Set(
          productsSnapshot.docs
            .map((doc) => doc.data().category)
            .filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCustomerDiscounts = async () => {
    try {
      const discountsQuery = query(
        collection(db, "customerDiscounts"),
        where("customerNameLower", "==", customer.name.toLowerCase())
      );
      const snapshot = await getDocs(discountsQuery);

      if (!snapshot.empty) {
        setDiscounts(snapshot.docs[0].data().discounts || []);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDiscount = () => {
    setDiscounts((prev) => [
      ...prev,
      {
        category: "",
        discountType: "percentage",
        discountValue: 0,
        active: true,
      },
    ]);
  };

  const updateDiscount = (index, field, value) => {
    setDiscounts((prev) =>
      prev.map((discount, i) =>
        i === index ? { ...discount, [field]: value } : discount
      )
    );
  };

  const removeDiscount = (index) => {
    setDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDiscounts = async () => {
    try {
      const discountsQuery = query(
        collection(db, "customerDiscounts"),
        where("customerNameLower", "==", customer.name.toLowerCase())
      );
      const snapshot = await getDocs(discountsQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "customerDiscounts"), {
          customerName: customer.name,
          customerNameLower: customer.name.toLowerCase(),
          discounts: discounts,
        });
      } else {
        await updateDoc(doc(db, "customerDiscounts", snapshot.docs[0].id), {
          discounts: discounts,
        });
      }
      alert("Discounts saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving discounts:", error);
      alert("Error saving discounts");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Discounts for {customer.name}</h2>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="discounts-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <div className="discounts-list">
                {discounts.map((discount, index) => (
                  <div key={index} className="discount-item">
                    <select
                      value={discount.category}
                      onChange={(e) =>
                        updateDiscount(index, "category", e.target.value)
                      }
                      className="discount-select"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <select
                      value={discount.discountType}
                      onChange={(e) =>
                        updateDiscount(index, "discountType", e.target.value)
                      }
                      className="discount-select"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₱)</option>
                    </select>

                    <input
                      type="number"
                      value={
                        discount.discountValue === 0
                          ? ""
                          : discount.discountValue
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        // For empty input, set to 0
                        if (rawValue === "") {
                          updateDiscount(index, "discountValue", 0);
                        } else {
                          // Remove leading zeros by parsing as number
                          const numericValue = parseFloat(rawValue);
                          updateDiscount(
                            index,
                            "discountValue",
                            isNaN(numericValue) ? 0 : numericValue
                          );
                        }
                      }}
                      onBlur={(e) => {
                        // Format the value on blur to remove any lingering formatting issues
                        const numericValue = parseFloat(e.target.value);
                        if (!isNaN(numericValue)) {
                          updateDiscount(index, "discountValue", numericValue);
                        }
                      }}
                      min="0"
                      max={discount.discountType === "percentage" ? 100 : 10000}
                      step={
                        discount.discountType === "percentage" ? "0.1" : "1"
                      }
                      className="discount-input"
                      placeholder="Value"
                    />

                    <label className="discount-active">
                      <input
                        type="checkbox"
                        checked={discount.active}
                        onChange={(e) =>
                          updateDiscount(index, "active", e.target.checked)
                        }
                      />
                      Active
                    </label>

                    <button
                      onClick={() => removeDiscount(index)}
                      className="btn-remove"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="discounts-actions">
                <button onClick={addDiscount} className="btn-add">
                  <FontAwesomeIcon icon={faPlus} />
                  Add Discount
                </button>
                <button onClick={saveDiscounts} className="btn-save">
                  <FontAwesomeIcon icon={faSave} />
                  Save Discounts
                </button>
                <button onClick={onClose} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
