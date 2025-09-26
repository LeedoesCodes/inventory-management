import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { AprioriAlgorithm } from "./algorithms/aprioriAlgorithm";

admin.initializeApp();

export const generateAssociationRules = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    try {
      console.log("Starting association rules generation...");

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const transactionsSnapshot = await admin
        .firestore()
        .collection("transactions")
        .where("timestamp", ">=", ninetyDaysAgo)
        .get();

      if (transactionsSnapshot.empty) {
        console.log("No transactions found for analysis");
        return null;
      }

      const transactions = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Processing ${transactions.length} transactions...`);

      const minSupport = 0.01;
      const minConfidence = 0.3;

      const frequentItemsets = AprioriAlgorithm.findFrequentItemsets(
        transactions,
        minSupport
      );
      const associationRules = AprioriAlgorithm.generateAssociationRules(
        frequentItemsets,
        transactions,
        minConfidence
      );

      console.log(`Generated ${associationRules.length} association rules`);

      await admin
        .firestore()
        .collection("associationRules")
        .doc("latest")
        .set({
          rules: associationRules,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          transactionCount: transactions.length,
          parameters: {
            minSupport,
            minConfidence,
            analysisPeriod: "90 days",
          },
          summary: {
            totalRules: associationRules.length,
            highConfidence: associationRules.filter(
              (rule) => rule.confidence >= 0.7
            ).length,
            mediumConfidence: associationRules.filter(
              (rule) => rule.confidence >= 0.4 && rule.confidence < 0.7
            ).length,
            lowConfidence: associationRules.filter(
              (rule) => rule.confidence < 0.4
            ).length,
          },
        });

      console.log("Association rules saved successfully");
      return null;
    } catch (error) {
      console.error("Error generating association rules:", error);
      return null;
    }
  });

export const getRecommendations = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    try {
      const { currentItems } = data;

      if (!currentItems || !Array.isArray(currentItems)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "currentItems must be an array"
        );
      }

      const rulesDoc = await admin
        .firestore()
        .collection("associationRules")
        .doc("latest")
        .get();

      if (!rulesDoc.exists) {
        return {
          recommendations: [],
          message: "No association rules available yet",
        };
      }

      const rulesData = rulesDoc.data();
      const rules = rulesData?.rules || [];

      const recommendations = rules
        .filter((rule) => {
          const antecedentMatch = rule.antecedent.every((item: string) =>
            currentItems.includes(item)
          );
          const consequentNotInCurrent = !rule.consequent.every(
            (item: string) => currentItems.includes(item)
          );
          return antecedentMatch && consequentNotInCurrent;
        })
        .slice(0, 10)
        .map((rule) => ({
          antecedent: rule.antecedent,
          consequent: rule.consequent,
          confidence: rule.confidence,
          support: rule.support,
          lift: rule.lift,
          strength:
            rule.confidence >= 0.7
              ? "high"
              : rule.confidence >= 0.4
              ? "medium"
              : "low",
        }));

      return {
        recommendations,
        generatedAt: rulesData?.generatedAt,
        totalRulesProcessed: rules.length,
      };
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get recommendations"
      );
    }
  }
);
