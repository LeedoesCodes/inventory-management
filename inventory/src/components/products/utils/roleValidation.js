// utils/roleValidation.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export const checkEmailRoleConflict = async (email, intendedRole) => {
  try {
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return { hasConflict: false };
    }

    const existingUser = querySnapshot.docs[0].data();

    // Check if email is already a customer trying to become staff
    if (
      intendedRole === "worker" &&
      (existingUser.intendedRole === "customer" ||
        existingUser.role === "customer")
    ) {
      return {
        hasConflict: true,
        message:
          "This email is already registered as a customer. Please use a different email for staff access.",
      };
    }

    // Check if email is already staff trying to become customer
    if (
      intendedRole === "customer" &&
      (existingUser.role === "approved" || existingUser.role === "admin")
    ) {
      return {
        hasConflict: true,
        message:
          "This email is already registered as staff. Please use a different email for customer access.",
      };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("Error checking email role conflict:", error);
    return { hasConflict: false, error: "Error checking email availability" };
  }
};
