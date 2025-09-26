export class AprioriAlgorithm {
  static findFrequentItemsets(
    transactions: any[],
    minSupport: number
  ): string[][] {
    let frequentItemsets: string[][] = [];

    // Step 1: Find frequent 1-itemsets
    let itemCount: { [key: string]: number } = {};
    transactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item: any) => {
          const itemId = item.itemId || item.id || item.name;
          if (itemId) {
            itemCount[itemId] = (itemCount[itemId] || 0) + 1;
          }
        });
      }
    });

    const totalTransactions = transactions.length;
    let frequentOneItemsets = Object.keys(itemCount)
      .filter((itemId) => itemCount[itemId] / totalTransactions >= minSupport)
      .map((itemId) => [itemId]);

    frequentItemsets = frequentItemsets.concat(frequentOneItemsets);

    // Step 2: Find frequent k-itemsets
    let k = 2;
    let currentFrequent = frequentOneItemsets;

    while (currentFrequent.length > 0) {
      let candidateItemsets = this.generateCandidates(currentFrequent, k - 1);
      let candidateCount: { [key: string]: number } = {};

      transactions.forEach((transaction) => {
        if (transaction.items && Array.isArray(transaction.items)) {
          const transactionItems = transaction.items
            .map((item: any) => item.itemId || item.id || item.name)
            .filter(Boolean);
          candidateItemsets.forEach((candidate) => {
            if (candidate.every((item) => transactionItems.includes(item))) {
              const key = candidate.sort().join("_");
              candidateCount[key] = (candidateCount[key] || 0) + 1;
            }
          });
        }
      });

      currentFrequent = candidateItemsets.filter((candidate) => {
        const key = candidate.sort().join("_");
        return (candidateCount[key] || 0) / totalTransactions >= minSupport;
      });

      frequentItemsets = frequentItemsets.concat(currentFrequent);
      k++;
    }

    return frequentItemsets;
  }

  static generateCandidates(
    previousFrequent: string[][],
    k: number
  ): string[][] {
    let candidates: string[][] = [];

    for (let i = 0; i < previousFrequent.length; i++) {
      for (let j = i + 1; j < previousFrequent.length; j++) {
        let candidate = [
          ...new Set([...previousFrequent[i], ...previousFrequent[j]]),
        ];
        if (candidate.length === k + 1) {
          candidates.push(candidate);
        }
      }
    }

    return candidates;
  }

  static generateAssociationRules(
    frequentItemsets: string[][],
    transactions: any[],
    minConfidence: number
  ): any[] {
    let rules: any[] = [];
    const totalTransactions = transactions.length;

    for (let itemset of frequentItemsets) {
      if (itemset.length < 2) continue;

      for (let i = 1; i < itemset.length; i++) {
        const antecedent = itemset.slice(0, i);
        const consequent = itemset.slice(i);

        const antecedentSupport = this.calculateSupport(
          antecedent,
          transactions
        );
        if (antecedentSupport === 0) continue;

        const ruleSupport = this.calculateSupport(itemset, transactions);
        const confidence = ruleSupport / antecedentSupport;

        if (confidence >= minConfidence) {
          const consequentSupport = this.calculateSupport(
            consequent,
            transactions
          );
          const lift =
            consequentSupport > 0
              ? confidence / (consequentSupport / totalTransactions)
              : 0;

          rules.push({
            antecedent,
            consequent,
            support: ruleSupport / totalTransactions,
            confidence: confidence,
            lift: lift,
          });
        }
      }
    }

    return rules.sort((a, b) => b.confidence - a.confidence);
  }

  static calculateSupport(items: string[], transactions: any[]): number {
    let count = 0;
    transactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        const transactionItems = transaction.items
          .map((item: any) => item.itemId || item.id || item.name)
          .filter(Boolean);
        if (items.every((item) => transactionItems.includes(item))) {
          count++;
        }
      }
    });
    return count;
  }
}
