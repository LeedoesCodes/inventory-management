import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../Firebase/firebase";

export const usePaymentTracking = (fetchOrders) => {
  const [paymentDetails, setPaymentDetails] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    paymentMethod: "cash",
  });

  const handleRecordPayment = async (order) => {
    try {
      const paymentAmount = parseFloat(paymentDetails.amount);

      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error("Please enter a valid payment amount.");
      }

      if (paymentAmount > order.remainingBalance) {
        throw new Error(
          `Payment amount cannot exceed remaining balance of ₱${order.remainingBalance.toFixed(
            2
          )}`
        );
      }

      const newPaidAmount = (order.paidAmount || 0) + paymentAmount;
      const newRemainingBalance = order.totalAmount - newPaidAmount;
      const newPaymentStatus = newRemainingBalance <= 0 ? "paid" : "partial";

      const paymentRecord = {
        amount: paymentAmount,
        date: new Date(paymentDetails.paymentDate),
        paymentMethod: paymentDetails.paymentMethod,
        notes: paymentDetails.notes,
        recordedAt: new Date(),
      };

      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        paymentStatus: newPaymentStatus,
        paymentHistory: [...(order.paymentHistory || []), paymentRecord],
        ...(newPaymentStatus === "paid" && { paidAt: new Date() }),
      });

      await fetchOrders();

      setPaymentDetails({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
        paymentMethod: "cash",
      });

      return true;
    } catch (err) {
      console.error("Error recording payment:", err);
      throw err;
    }
  };

  const handleMarkAsPaid = async (order) => {
    try {
      const paymentRecord = {
        amount: order.remainingBalance,
        date: new Date(),
        paymentMethod: order.paymentMethod,
        notes: "Marked as paid in full",
        recordedAt: new Date(),
      };

      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        paidAmount: order.totalAmount,
        remainingBalance: 0,
        paymentStatus: "paid",
        paymentHistory: [...(order.paymentHistory || []), paymentRecord],
        paidAt: new Date(),
      });

      await fetchOrders();
      return true;
    } catch (err) {
      console.error("Error marking order as paid:", err);
      throw err;
    }
  };

  return {
    paymentDetails,
    setPaymentDetails,
    handleRecordPayment,
    handleMarkAsPaid,
  };
};
