/**
 * ローン計算エンジン
 * 元利均等返済と元金均等返済の両方に対応
 */

class LoanCalculator {
  /**
   * 毎月返済額を計算
   * @param {number} principal - 元本金額
   * @param {number} annualRate - 年利率（%）
   * @param {number} months - 返済月数
   * @param {string} repaymentType - 返済方式 ('equal_payment' または 'equal_principal')
   * @returns {number} 毎月返済額
   */
  static calculateMonthlyPayment(principal, annualRate, months, repaymentType) {
    if (principal <= 0 || annualRate < 0 || months <= 0) {
      throw new Error('入力値が不正です');
    }

    const monthlyRate = annualRate / 100 / 12;

    if (repaymentType === 'equal_payment') {
      // 元利均等返済：毎月返済額 = 元本 × [r(1+r)^n] / [(1+r)^n - 1]
      if (monthlyRate === 0) {
        return principal / months;
      }
      const denominator = Math.pow(1 + monthlyRate, months) - 1;
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
      return principal * (numerator / denominator);
    } else if (repaymentType === 'equal_principal') {
      // 元金均等返済：初月の返済額は最も多い
      const principalPayment = principal / months;
      const firstMonthInterest = principal * monthlyRate;
      return principalPayment + firstMonthInterest;
    } else {
      throw new Error('不正な返済方式です');
    }
  }

  /**
   * 返済スケジュール表を生成
   * @param {number} principal - 元本金額
   * @param {number} annualRate - 年利率（%）
   * @param {number} months - 返済月数
   * @param {Date} startDate - 返済開始日
   * @param {string} repaymentType - 返済方式
   * @returns {Array<Object>} 返済スケジュール
   */
  static generateRepaymentSchedule(principal, annualRate, months, startDate, repaymentType) {
    const monthlyRate = annualRate / 100 / 12;
    const schedule = [];
    let balance = principal;

    for (let month = 1; month <= months; month++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + month - 1);

      let principalPayment, interestPayment, monthlyPayment;

      if (repaymentType === 'equal_payment') {
        // 元利均等返済
        monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months, repaymentType);
        interestPayment = balance * monthlyRate;
        principalPayment = monthlyPayment - interestPayment;
      } else {
        // 元金均等返済
        principalPayment = principal / months;
        interestPayment = balance * monthlyRate;
        monthlyPayment = principalPayment + interestPayment;
      }

      balance -= principalPayment;
      // 端数処理：最終月で丸め誤差を調整
      if (month === months) {
        balance = 0;
      }

      schedule.push({
        month,
        paymentDate: paymentDate.toISOString().split('T')[0],
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(balance * 100) / 100)
      });
    }

    return schedule;
  }

  /**
   * 指定月の返済詳細情報を取得
   * @param {number} principal - 元本金額
   * @param {number} annualRate - 年利率（%）
   * @param {number} months - 返済月数
   * @param {number} targetMonth - 対象月（1始まり）
   * @param {Date} startDate - 返済開始日
   * @param {string} repaymentType - 返済方式
   * @returns {Object} 指定月の返済情報
   */
  static getMonthlyDetails(principal, annualRate, months, targetMonth, startDate, repaymentType) {
    if (targetMonth < 1 || targetMonth > months) {
      throw new Error('月数が範囲外です');
    }

    const schedule = this.generateRepaymentSchedule(principal, annualRate, months, startDate, repaymentType);
    return schedule[targetMonth - 1];
  }

  /**
   * 返済方式を判定（支払い額の推移から）
   * @param {Array<number>} monthlyPayments - 過去の毎月支払い額
   * @returns {string} 判定された返済方式 ('equal_payment' または 'equal_principal')
   */
  static detectRepaymentType(monthlyPayments) {
    if (!monthlyPayments || monthlyPayments.length < 2) {
      return 'equal_payment'; // デフォルトは元利均等
    }

    // 返済額の標準偏差を計算
    const mean = monthlyPayments.reduce((a, b) => a + b) / monthlyPayments.length;
    const variance = monthlyPayments.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyPayments.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // 変動係数が小さい場合は元利均等、大きい場合は元金均等
    // 閾値：0.05（5%）
    return coefficientOfVariation < 0.05 ? 'equal_payment' : 'equal_principal';
  }

  /**
   * 総返済額を計算
   * @param {Array<Object>} schedule - 返済スケジュール
   * @returns {Object} 総返済額、総利息額
   */
  static calculateTotals(schedule) {
    const totalPayment = schedule.reduce((sum, item) => sum + item.monthlyPayment, 0);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interestPayment, 0);
    return {
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100
    };
  }
}

// グローバルに公開（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.LoanCalculator = LoanCalculator;
}

// Node.js環境用エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoanCalculator;
}
