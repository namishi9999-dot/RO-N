/**
 * ローン分析エンジン
 * 現在のローン情報から金利や完済日を逆算
 */

class LoanAnalyzer {
  /**
   * ニュートン法を使用して金利を逆算
   * @param {number} monthlyPayment - 毎月の支払い額
   * @param {number} principal - 元本金額
   * @param {number} months - 返済月数
   * @param {string} repaymentType - 返済方式
   * @returns {number} 推定年利率（%）
   */
  static estimateInterestRate(monthlyPayment, principal, months, repaymentType) {
    if (monthlyPayment <= 0 || principal <= 0 || months <= 0) {
      throw new Error('入力値が不正です');
    }

    if (repaymentType === 'equal_payment') {
      return this._estimateRateForEqualPayment(monthlyPayment, principal, months);
    } else if (repaymentType === 'equal_principal') {
      return this._estimateRateForEqualPrincipal(monthlyPayment, principal, months);
    } else {
      throw new Error('不正な返済方式です');
    }
  }

  /**
   * 元利均等返済の金利を逆算（ニュートン法）
   * @private
   */
  static _estimateRateForEqualPayment(monthlyPayment, principal, months) {
    // 初期値：月利率 0.5%
    let r = 0.005;
    const tolerance = 1e-8;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      // 現在の月利率で計算される月返済額
      const pow = Math.pow(1 + r, months);
      const calculatedPayment = principal * (r * pow) / (pow - 1);

      // 誤差
      const error = calculatedPayment - monthlyPayment;

      if (Math.abs(error) < tolerance) {
        // 収束したら年利率に変換して返す
        return r * 12 * 100;
      }

      // 導関数を計算（数値微分）
      const h = 1e-8;
      const pow2 = Math.pow(1 + r + h, months);
      const calculatedPayment2 = principal * ((r + h) * pow2) / (pow2 - 1);
      const derivative = (calculatedPayment2 - calculatedPayment) / h;

      if (Math.abs(derivative) < 1e-10) {
        // 導関数が0に近い場合は収束不可
        break;
      }

      // ニュートン法：r_new = r - f(r) / f'(r)
      r = r - error / derivative;

      // 月利率が負にならないようにチェック
      if (r < 0) {
        r = 1e-10;
      }
      if (r > 0.5) {
        r = 0.5; // 月60%以上の金利はあり得ないので上限設定
      }
    }

    // 収束しなかった場合は最後の推定値を返す
    return Math.max(0, r * 12 * 100);
  }

  /**
   * 元金均等返済の金利を逆算
   * @private
   */
  static _estimateRateForEqualPrincipal(monthlyPayment, principal, months) {
    // 初期値：月利率 0.5%
    let r = 0.005;
    const tolerance = 1e-8;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      // 元金均等返済：初月の返済額 = 元本/月数 + 元本 × 月利率
      const principalPayment = principal / months;
      const firstMonthInterest = principal * r;
      const calculatedPayment = principalPayment + firstMonthInterest;

      // 誤差
      const error = calculatedPayment - monthlyPayment;

      if (Math.abs(error) < tolerance) {
        return r * 12 * 100;
      }

      // 導関数：d(payment)/dr = 元本
      const derivative = principal;

      if (Math.abs(derivative) < 1e-10) {
        break;
      }

      // ニュートン法
      r = r - error / derivative;

      if (r < 0) {
        r = 1e-10;
      }
      if (r > 0.5) {
        r = 0.5;
      }
    }

    return Math.max(0, r * 12 * 100);
  }

  /**
   * 完済予定日を計算
   * @param {number} principal - 元本金額
   * @param {number} monthlyPayment - 毎月の支払い額
   * @param {number} annualRate - 推定年利率（%）
   * @param {Date} startDate - 返済開始日
   * @param {string} repaymentType - 返済方式
   * @returns {Date} 完済予定日
   */
  static calculatePayoffDate(principal, monthlyPayment, annualRate, startDate, repaymentType) {
    const monthlyRate = annualRate / 100 / 12;
    let balance = principal;
    let month = 0;

    // ローンが返済不可能な場合をチェック
    if (monthlyPayment <= 0) {
      throw new Error('毎月の返済額が不正です');
    }

    const maxMonths = 600; // 最大50年（600ヶ月）

    while (balance > 0 && month < maxMonths) {
      month++;

      if (repaymentType === 'equal_payment') {
        // 元利均等返済
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;

        if (principalPayment <= 0) {
          // 利息だけでは返済が進まない場合
          throw new Error('毎月の返済額が利息より少なく、ローンが返済できません');
        }

        balance -= principalPayment;
      } else {
        // 元金均等返済
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;

        if (principalPayment <= 0) {
          throw new Error('毎月の返済額が利息より少なく、ローンが返済できません');
        }

        balance -= principalPayment;
      }

      balance = Math.max(0, balance);
    }

    if (month >= maxMonths) {
      throw new Error('返済が長期化しすぎています（50年以上）');
    }

    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + month);
    return payoffDate;
  }

  /**
   * 返済方式を自動判定（支払い額の推移から）
   * @param {Array<number>} monthlyPayments - 過去数ヶ月の支払い額
   * @returns {string} 推定返済方式
   */
  static autoDetectRepaymentType(monthlyPayments) {
    if (!monthlyPayments || monthlyPayments.length < 2) {
      return 'equal_payment'; // デフォルト
    }

    // 支払い額の変動を分析
    const differences = [];
    for (let i = 1; i < monthlyPayments.length; i++) {
      differences.push(monthlyPayments[i] - monthlyPayments[i - 1]);
    }

    // 平均変動量を計算
    const avgChange = differences.reduce((a, b) => a + b, 0) / differences.length;

    // 平均変動が負（減少傾向）で、かつ一貫性がある場合は元金均等返済
    if (avgChange < -0.001) {
      return 'equal_principal';
    }

    // デフォルトは元利均等返済
    return 'equal_payment';
  }

  /**
   * 不足している情報を逆算
   * @param {Object} givenValues - 与えられた値 {principal, monthlyPayment, months, rate}
   * @returns {Object} 計算された値を含むオブジェクト
   */
  static calculateMissingValue(givenValues) {
    const { principal, monthlyPayment, months, rate } = givenValues;
    const result = { ...givenValues };

    // principal, monthlyPayment, monthsのいずれか1つが不足している場合に対応
    // ここでは基本的な逆算のみ実装（詳細は実装に応じて拡張）

    if (principal === undefined || principal === null) {
      // 元本が不足している場合
      if (monthlyPayment && months && rate) {
        // 月返済額と月数と金利から元本を計算
        const monthlyRate = rate / 100 / 12;
        if (monthlyRate === 0) {
          result.principal = monthlyPayment * months;
        } else {
          const denominator = Math.pow(1 + monthlyRate, months) - 1;
          const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
          result.principal = monthlyPayment / (numerator / denominator);
        }
      }
    }

    return result;
  }

  /**
   * 総合分析：複数の入力パターンに対応
   * @param {Object} analysisParams - 分析パラメータ
   * @param {string} repaymentType - 返済方式（'auto'で自動判定）
   * @returns {Object} 分析結果
   */
  static analyzeCurrentLoan(analysisParams, repaymentType = 'auto') {
    const {
      startDate,
      monthlyPayment,
      principal,
      remainingBalance,
      elapsedMonths
    } = analysisParams;

    if (!startDate || !monthlyPayment) {
      throw new Error('開始日と毎月返済額は必須です');
    }

    let detectedType = repaymentType;

    // 自動判定の場合
    if (repaymentType === 'auto') {
      // 複数月のデータがある場合は判定可能
      // ここではデフォルトを元利均等返済とする
      detectedType = 'equal_payment';
    }

    let estimatedRate, payoffDate, remainingMonths, estimatedPrincipal;

    try {
      // 元本が与えられている場合
      if (principal) {
        estimatedRate = this.estimateInterestRate(monthlyPayment, principal, elapsedMonths || 12, detectedType);
        payoffDate = this.calculatePayoffDate(principal, monthlyPayment, estimatedRate, startDate, detectedType);

        const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
        remainingMonths = Math.ceil((payoffDate.getTime() - new Date().getTime()) / msPerMonth);

        estimatedPrincipal = principal;
      } else if (remainingBalance !== undefined) {
        // 残高が与えられている場合
        // 仮に返済月数を推定する必要がある
        estimatedRate = this.estimateInterestRate(monthlyPayment, remainingBalance, 12, detectedType);
        payoffDate = this.calculatePayoffDate(remainingBalance, monthlyPayment, estimatedRate, new Date(), detectedType);

        const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
        remainingMonths = Math.ceil((payoffDate.getTime() - new Date().getTime()) / msPerMonth);

        estimatedPrincipal = remainingBalance;
      }

      return {
        estimatedRate: Math.round(estimatedRate * 100) / 100,
        payoffDate: payoffDate.toISOString().split('T')[0],
        remainingMonths,
        repaymentType: detectedType,
        principalAmount: Math.round(estimatedPrincipal * 100) / 100
      };
    } catch (error) {
      throw new Error(`分析に失敗しました: ${error.message}`);
    }
  }
}

// グローバルに公開（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.LoanAnalyzer = LoanAnalyzer;
}

// Node.js環境用エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoanAnalyzer;
}
