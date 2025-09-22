import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

export default function ProductList({ products, onEdit, onDelete }) {
  return (
    <div className="product-list">
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <div className="product-details">
              <div className="product-name">{p.name}</div>
              <div className="product-price">₱{p.price}</div>
              <div className="product-stock">Stock: {p.stock}</div>
              <div className="product-category">Category: {p.category}</div>
            </div>
            <div className="actions">
              <button onClick={() => onEdit(p)}>Edit</button>
              <button onClick={() => onDelete(p.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
