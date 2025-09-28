import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/CSVUploader.scss";

// 1. 🔥 FIREBASE IMPORTS ADDED
import { db } from "../Firebase/firebase"; // **UPDATE THIS PATH to your firebase config file**
import { collection, addDoc, Timestamp } from "firebase/firestore";

// OPTIMIZED Apriori Algorithm for Large Datasets
const optimizedApriori = (transactions, minSupport) => {
  console.log(
    `Processing ${transactions.length} transactions with ${minSupport} min support`
  ); // Phase 1: Efficient frequent itemset generation

  const getFrequentItemsets = (transactions, minSupport) => {
    const itemCount = {};
    const minCount = Math.ceil(transactions.length * minSupport); // Count items efficiently

    transactions.forEach((transaction) => {
      transaction.forEach((item) => {
        itemCount[item] = (itemCount[item] || 0) + 1;
      });
    }); // Filter by minimum support

    const frequentItems = Object.keys(itemCount).filter(
      (item) => itemCount[item] >= minCount
    );

    return frequentItems.map((item) => [item]);
  };

  const generateCandidates = (itemsets, length) => {
    const candidates = [];
    const itemsetsSet = new Set(
      itemsets.map((itemset) => itemset.sort().join(","))
    );

    for (let i = 0; i < itemsets.length; i++) {
      for (let j = i + 1; j < itemsets.length; j++) {
        const union = [...new Set([...itemsets[i], ...itemsets[j]])];
        if (union.length === length) {
          const candidateKey = union.sort().join(","); // Avoid duplicates
          if (!itemsetsSet.has(candidateKey)) {
            candidates.push(union);
            itemsetsSet.add(candidateKey);
          }
        }
      }
    }
    return candidates;
  };

  let itemsets = getFrequentItemsets(transactions, minSupport);
  const allItemsets = [...itemsets];
  let k = 2; // Limit the itemset size for performance

  const maxItemsetSize = 3; // Only look for pairs and triplets

  while (itemsets.length > 0 && k <= maxItemsetSize) {
    console.log(`Generating ${k}-itemsets...`);

    const candidates = generateCandidates(itemsets, k);
    const candidateCount = {}; // Efficient counting using transaction sets

    transactions.forEach((transaction) => {
      const transactionSet = new Set(transaction);
      candidates.forEach((candidate) => {
        if (candidate.every((item) => transactionSet.has(item))) {
          const key = candidate.sort().join(",");
          candidateCount[key] = (candidateCount[key] || 0) + 1;
        }
      });
    });

    const minCount = Math.ceil(transactions.length * minSupport);
    itemsets = Object.keys(candidateCount)
      .filter((key) => candidateCount[key] >= minCount)
      .map((key) => key.split(","));

    console.log(`Found ${itemsets.length} frequent ${k}-itemsets`);

    allItemsets.push(...itemsets);
    k++;
  }

  return allItemsets;
};

const generateRules = (itemsets, transactions, minConfidence) => {
  console.log("Generating rules from itemsets..."); // Precompute support for efficiency

  const supportCache = new Map();

  const getSupport = (itemset) => {
    const key = itemset.sort().join(",");
    if (supportCache.has(key)) {
      return supportCache.get(key);
    }

    let count = 0;
    transactions.forEach((transaction) => {
      if (itemset.every((item) => transaction.includes(item))) {
        count++;
      }
    });

    const support = count / transactions.length;
    supportCache.set(key, support);
    return support;
  };

  const getSubsets = (arr) => {
    if (arr.length <= 1) return [];

    const subsets = []; // Only consider reasonable splits (not too small/large)
    for (let i = 1; i < arr.length; i++) {
      if (i <= 2 && arr.length - i <= 2) {
        // Limit subset sizes
        subsets.push(arr.slice(0, i));
      }
    }
    return subsets;
  };

  const rules = [];
  const addedRules = new Set(); // Only process itemsets with 2+ items

  const multiItemsets = itemsets.filter((itemset) => itemset.length >= 2);

  multiItemsets.forEach((itemset) => {
    const subsets = getSubsets(itemset);

    subsets.forEach((subset) => {
      const consequent = itemset.filter((item) => !subset.includes(item));
      if (consequent.length > 0) {
        const ruleKey = `${subset.sort().join(",")}->${consequent
          .sort()
          .join(",")}`;

        if (!addedRules.has(ruleKey)) {
          const confidence = getSupport(itemset) / getSupport(subset);

          if (confidence >= minConfidence) {
            const support = getSupport(itemset);
            const lift =
              getSupport(itemset) /
              (getSupport(subset) * getSupport(consequent));

            rules.push({
              antecedent: subset,
              consequent,
              confidence,
              support,
              lift: lift || 1,
            });

            addedRules.add(ruleKey);
          }
        }
      }
    });
  }); // Sort by confidence (highest first)

  return rules.sort((a, b) => b.confidence - a.confidence);
};

// Helper function to serialize the complex rule objects for Firestore
const serializeRules = (rules) => {
  return rules.map((rule) => ({
    antecedent: rule.antecedent.join(", "), // Convert array to string
    consequent: rule.consequent.join(", "), // Convert array to string
    confidence: rule.confidence,
    support: rule.support,
    lift: rule.lift,
  }));
};

const CSVUploader = ({ onUploadComplete, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [previewResults, setPreviewResults] = useState(null);
  const [processingStage, setProcessingStage] = useState("");
  const { user } = useContext(AuthContext); // Accessing the logged-in user

  const parseCSVToTransactions = (csvText) => {
    console.time("CSV Parsing");
    setProcessingStage("Parsing CSV file...");

    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) {
      throw new Error("CSV must have at least 2 lines (header + data)");
    }

    const headers = lines[0].split(",").map((header) => header.trim()); // Validate headers

    if (!headers.includes("Transaction")) {
      throw new Error('CSV must have "Transaction" column');
    }

    const transactions = [];
    let skippedRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((value) => value.trim()); // Skip if row doesn't match header length

      if (values.length !== headers.length) {
        skippedRows++;
        continue;
      }

      const transactionItems = [];

      headers.forEach((header, index) => {
        // Skip Transaction column and only include 1 values
        if (header !== "Transaction" && values[index] === "1") {
          transactionItems.push(header);
        }
      });

      if (transactionItems.length > 0) {
        transactions.push(transactionItems);
      }
    }

    if (transactions.length === 0) {
      throw new Error("No valid transactions found (all rows had 0 purchases)");
    }

    console.timeEnd("CSV Parsing");
    console.log(
      `Parsed ${transactions.length} transactions, skipped ${skippedRows} rows`
    );
    console.log(`Products in CSV: ${headers.length - 1}`);

    return transactions;
  };

  const processCSVWithApriori = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          setProcessingStage("Parsing transactions...");
          const transactions = parseCSVToTransactions(csvText);

          console.log(`Processing ${transactions.length} transactions`);
          console.log("Sample transaction:", transactions[0]); // Adaptive parameters based on data size

          let minSupport, minConfidence;

          if (transactions.length > 200) {
            minSupport = 0.15; // Higher for large datasets
            minConfidence = 0.5;
          } else if (transactions.length > 100) {
            minSupport = 0.1;
            minConfidence = 0.45;
          } else {
            minSupport = 0.05;
            minConfidence = 0.4;
          }

          setProcessingStage("Finding frequent itemsets...");
          const itemsets = optimizedApriori(transactions, minSupport);

          setProcessingStage("Generating association rules...");
          const rules = generateRules(itemsets, transactions, minConfidence);

          console.log(`Generated ${rules.length} rules`);
          console.log("Top rules:", rules.slice(0, 3));

          resolve({
            transactions: transactions.length,
            rules: rules,
            itemsets: itemsets,
            processedAt: new Date(),
            parameters: {
              minSupport,
              minConfidence,
              maxItemsetSize: 3,
            },
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return; // Check file size (max 10MB for large datasets)

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Please use a file smaller than 10MB.");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setPreviewResults(null);
    setProcessingStage("Starting processing...");

    try {
      // Progress simulation with actual stages
      const progressStages = [
        "Reading file...",
        "Parsing CSV...",
        "Analyzing patterns...",
        "Generating rules...",
      ];
      let stageIndex = 0;

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 5;
        }); // Update stage message

        if (stageIndex < progressStages.length - 1) {
          setProcessingStage(progressStages[stageIndex]);
          stageIndex++;
        }
      }, 500); // Process the CSV locally

      const results = await processCSVWithApriori(file);

      clearInterval(progressInterval);
      setProgress(100);
      setProcessingStage("Complete!"); // Show preview

      setPreviewResults(results);

      console.log("📊 Processed Results:", results);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setProcessingStage("");
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error: " + error.message);
      setUploading(false);
      setProgress(0);
      setProcessingStage("");
    }
  }; // 2. 💾 UPDATED handleSaveToFirestore FUNCTION

  const handleSaveToFirestore = async () => {
    if (!previewResults || !user || !user.uid) {
      alert(
        "Error: Cannot save. Please log in or ensure analysis is complete."
      );
      return;
    }

    setProcessingStage("Saving results to Firestore...");

    const dataToSave = {
      userId: user.uid, // Use the user's ID for security and queries
      fileName: fileName, // Serialize complex rule array into a simpler format for Firestore
      rules: serializeRules(previewResults.rules), // Save summary and parameters

      summary: {
        totalTransactions: previewResults.transactions,
        rulesCount: previewResults.rules.length,
        parameters: previewResults.parameters,
      }, // Use Firestore's server timestamp for an accurate record
      timestamp: Timestamp.fromDate(new Date()),
    };

    try {
      // Asynchronously save the data to the 'analysis_jobs' collection
      const docRef = await addDoc(collection(db, "analysis_jobs"), dataToSave);

      setProcessingStage("Save Complete!");

      // Call the external handler with the new document ID
      if (onUploadComplete) {
        onUploadComplete({
          jobId: docRef.id,
          fileName,
          results: previewResults,
          timestamp: new Date(),
        });
      }

      alert(
        `✅ Analysis results saved successfully! Document ID: ${docRef.id}`
      );
      onClose();
    } catch (error) {
      console.error("🔥 Firestore Save Failed:", error);
      setProcessingStage("Save failed.");
      alert(`❌ Error saving results: ${error.message}`);
    }
  }; // Function to get lift interpretation

  const getLiftInterpretation = (lift) => {
    if (lift > 1.5) return "Strong positive association";
    if (lift > 1.2) return "Moderate positive association";
    if (lift > 0.8) return "Weak association";
    if (lift > 0.5) return "Negative association";
    return "Strong negative association";
  }; // Function to get lift color class

  const getLiftColorClass = (lift) => {
    if (lift > 1.5) return "lift-strong";
    if (lift > 1.2) return "lift-moderate";
    if (lift > 0.8) return "lift-weak";
    if (lift > 0.5) return "lift-negative";
    return "lift-strong-negative";
  };

  return (
    <div className="csv-uploader-overlay">
           {" "}
      <div className="csv-uploader-modal">
               {" "}
        <div className="modal-header">
                    <h3>📊 CSV Analysis</h3>         {" "}
          <button className="close-btn" onClick={onClose}>
                        ×          {" "}
          </button>
                 {" "}
        </div>
               {" "}
        <div className="upload-content">
                    {/* Upload Section */}         {" "}
          {!previewResults && (
            <>
                           {" "}
              <div className="upload-area">
                               {" "}
                <input
                  type="file"
                  id="csv-file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                               {" "}
                <label htmlFor="csv-file" className="file-label">
                                   {" "}
                  {uploading ? (
                    <>
                                           {" "}
                      <div className="upload-progress">
                                               {" "}
                        <div
                          className="progress-bar"
                          style={{ width: `${progress}%` }}
                        ></div>
                                             {" "}
                      </div>
                                           {" "}
                      <span>
                                                Processing {fileName}...{" "}
                        {progress}%                      {" "}
                      </span>
                                            <small>{processingStage}</small>   
                                     {" "}
                    </>
                  ) : (
                    <>
                                           {" "}
                      <div className="upload-icon">📁</div>                     {" "}
                      <span>Choose CSV File</span>                     {" "}
                      <small>
                                                Optimized for large datasets
                        (334 products, 100+                        
                        transactions)                      {" "}
                      </small>
                                         {" "}
                    </>
                  )}
                                 {" "}
                </label>
                             {" "}
              </div>
                           {" "}
              <div className="format-info">
                                <h4>Expected CSV Format:</h4>               {" "}
                <pre>
                                   {" "}
                  {`Transaction,Product1,Product2,Product3,...,Product334
1,1,0,0,...,0
2,0,1,1,...,1
...`}
                                 {" "}
                </pre>
                                <p>• 1 = purchased, 0 = not purchased</p>       
                       {" "}
                <p>• First row = headers, "Transaction" column required</p>     
                         {" "}
                <p className="test-mode">
                                    🔒 <strong>OPTIMIZED MODE:</strong> Handles
                  large datasets                   efficiently                {" "}
                </p>
                             {" "}
              </div>
                         {" "}
            </>
          )}
                    {/* Results Preview */}         {" "}
          {previewResults && (
            <div className="preview-results">
                           {" "}
              <div className="preview-header">
                                <h4>✅ Analysis Complete!</h4>               {" "}
                <p>Found {previewResults.rules.length} association rules</p>   
                         {" "}
              </div>
                           {" "}
              <div className="results-summary">
                               {" "}
                <div className="summary-item">
                                    <span>Transactions:</span>                 {" "}
                  <strong>{previewResults.transactions}</strong>               {" "}
                </div>
                               {" "}
                <div className="summary-item">
                                    <span>Rules Found:</span>                 {" "}
                  <strong>{previewResults.rules.length}</strong>               {" "}
                </div>
                               {" "}
                <div className="summary-item">
                                    <span>Parameters:</span>                 {" "}
                  <strong>
                                        Support:                    {" "}
                    {(previewResults.parameters.minSupport * 100).toFixed(1)}%  
                                   {" "}
                  </strong>
                                 {" "}
                </div>
                               {" "}
                <div className="summary-item">
                                    <span>File:</span>                 {" "}
                  <strong>{fileName}</strong>               {" "}
                </div>
                             {" "}
              </div>
                           {" "}
              <div className="top-rules">
                                <h5>Top Rules (by confidence):</h5>             
                 {" "}
                {previewResults.rules.slice(0, 8).map((rule, index) => (
                  <div key={index} className="rule-item">
                                       {" "}
                    <div className="rule-text">
                                           {" "}
                      <strong>{rule.antecedent.join(" + ")}</strong> →          
                                  {rule.consequent.join(" + ")}                 
                       {" "}
                    </div>
                                       {" "}
                    <div className="rule-stats">
                                           {" "}
                      <div className="stat-group">
                                               {" "}
                        <span className="stat-label">Confidence:</span>         
                                     {" "}
                        <strong className="stat-value confidence">
                                                   {" "}
                          {(rule.confidence * 100).toFixed(1)}%                
                                 {" "}
                        </strong>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="stat-group">
                                               {" "}
                        <span className="stat-label">Support:</span>           
                                   {" "}
                        <span className="stat-value support">
                                                   {" "}
                          {(rule.support * 100).toFixed(1)}%                    
                             {" "}
                        </span>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="stat-group">
                                               {" "}
                        <span className="stat-label">Lift:</span>               
                               {" "}
                        <span
                          className={`stat-value lift ${getLiftColorClass(
                            rule.lift
                          )}`}
                        >
                                                    {rule.lift.toFixed(2)}     
                                           {" "}
                        </span>
                                               {" "}
                        <span className="lift-interpretation">
                                                   {" "}
                          {getLiftInterpretation(rule.lift)}                   
                             {" "}
                        </span>
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                ))}
                             {" "}
              </div>
                           {" "}
              <div className="lift-info">
                                <h6>📊 Understanding Lift:</h6>               {" "}
                <div className="lift-scale">
                                   {" "}
                  <div className="lift-item">
                                       {" "}
                    <span className="lift-indicator lift-strong"></span>       
                               {" "}
                    <span>Strong (&gt;1.5): Items strongly related</span>       
                             {" "}
                  </div>
                                   {" "}
                  <div className="lift-item">
                                       {" "}
                    <span className="lift-indicator lift-moderate"></span>     
                                 {" "}
                    <span>Moderate (1.2-1.5): Items moderately related</span>   
                                 {" "}
                  </div>
                                   {" "}
                  <div className="lift-item">
                                       {" "}
                    <span className="lift-indicator lift-weak"></span>         
                             {" "}
                    <span>Weak (0.8-1.2): Little to no relationship</span>     
                               {" "}
                  </div>
                                   {" "}
                  <div className="lift-item">
                                       {" "}
                    <span className="lift-indicator lift-negative"></span>     
                                 {" "}
                    <span>
                                            Negative (&lt;0.8): Items rarely
                      bought together                    {" "}
                    </span>
                                     {" "}
                  </div>
                                 {" "}
                </div>
                             {" "}
              </div>
                           {" "}
              <div className="preview-actions">
                               {" "}
                <button onClick={handleSaveToFirestore} className="save-btn">
                                    💾 Save to Database                {" "}
                </button>
                               {" "}
                <button
                  onClick={() => setPreviewResults(null)}
                  className="analyze-another-btn"
                >
                                    📊 Analyze Another File                {" "}
                </button>
                               {" "}
                <button onClick={onClose} className="close-preview-btn">
                                    Close                {" "}
                </button>
                             {" "}
              </div>
                         {" "}
            </div>
          )}
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default CSVUploader;
