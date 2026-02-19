/**
 * ローン計算アプリ - メイン処理
 */

document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
});

function initializeApp() {
  // 今日の日付をデフォルト値として設定
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').valueAsDate = new Date();
  document.getElementById('analyzeStartDate').valueAsDate = new Date();

  // タブ切り替え処理
  setupTabs();

  // フォーム送信処理
  document.getElementById('calculatorForm').addEventListener('submit', handleCalculatorSubmit);
  document.getElementById('analyzerForm').addEventListener('submit', handleAnalyzerSubmit);

  // 指定月の詳細表示
  document.getElementById('getMonthlyDetails').addEventListener('click', handleGetMonthlyDetails);
}

// ========== Tab Management ==========
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');

      // すべてのタブを非表示
      tabContents.forEach(content => content.classList.remove('active'));
      tabButtons.forEach(btn => btn.classList.remove('active'));

      // 選択されたタブを表示
      document.getElementById(tabName).classList.add('active');
      this.classList.add('active');
    });
  });
}

// ========== Calculator Functions ==========
function handleCalculatorSubmit(e) {
  e.preventDefault();

  try {
    const principal = parseFloat(document.getElementById('principal').value);
    const annualRate = parseFloat(document.getElementById('annualRate').value);
    const years = parseInt(document.getElementById('years').value);
    const months = parseInt(document.getElementById('months').value) || 0;
    const startDate = new Date(document.getElementById('startDate').value);
    const repaymentType = document.querySelector('input[name="repaymentType"]:checked').value;

    // バリデーション
    if (isNaN(principal) || principal <= 0) throw new Error('借入額を正しく入力してください');
    if (isNaN(annualRate) || annualRate < 0) throw new Error('年利率を正しく入力してください');
    if (isNaN(years) || years <= 0) throw new Error('返済期間を正しく入力してください');

    const totalMonths = years * 12 + months;

    // 計算実行
    const monthlyPayment = LoanCalculator.calculateMonthlyPayment(principal, annualRate, totalMonths, repaymentType);
    const schedule = LoanCalculator.generateRepaymentSchedule(principal, annualRate, totalMonths, startDate, repaymentType);
    const totals = LoanCalculator.calculateTotals(schedule);

    // 結果表示
    displayCalculatorResults(monthlyPayment, totals, schedule, totalMonths);

    // 結果エリアを表示
    document.getElementById('calculatorResults').style.display = 'block';

    // ターゲット月の最大値を更新
    document.getElementById('targetMonth').max = totalMonths;

  } catch (error) {
    showError('計算エラー: ' + error.message);
  }
}

function displayCalculatorResults(monthlyPayment, totals, schedule, totalMonths) {
  // 結果カードを更新
  const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

  document.getElementById('monthlyPaymentResult').textContent = formatter.format(monthlyPayment);
  document.getElementById('totalPaymentResult').textContent = formatter.format(totals.totalPayment);
  document.getElementById('totalInterestResult').textContent = formatter.format(totals.totalInterest);

  // 返済スケジュール表を作成
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';

  // 最初の12ヶ月と最後の3ヶ月を表示、その他は省略
  const displayMonths = [];
  for (let i = 0; i < Math.min(12, totalMonths); i++) {
    displayMonths.push(schedule[i]);
  }

  if (totalMonths > 15) {
    // 省略行を追加
    const omittedRow = document.createElement('tr');
    omittedRow.style.opacity = '0.5';
    omittedRow.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 10px;">
        ... ${totalMonths - 15}ヶ月省略 ...
      </td>
    `;
    tbody.appendChild(omittedRow);

    // 最後の3ヶ月を追加
    for (let i = totalMonths - 3; i < totalMonths; i++) {
      const row = createScheduleRow(schedule[i]);
      tbody.appendChild(row);
    }
  } else {
    // 全月を表示
    schedule.forEach(item => {
      const row = createScheduleRow(item);
      tbody.appendChild(row);
    });
  }
}

function createScheduleRow(item) {
  const row = document.createElement('tr');
  const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

  row.innerHTML = `
    <td>${item.month}</td>
    <td>${item.paymentDate}</td>
    <td>${formatter.format(item.monthlyPayment)}</td>
    <td>${formatter.format(item.principalPayment)}</td>
    <td>${formatter.format(item.interestPayment)}</td>
    <td>${formatter.format(item.remainingBalance)}</td>
  `;

  return row;
}

function handleGetMonthlyDetails() {
  try {
    const targetMonth = parseInt(document.getElementById('targetMonth').value);
    const principal = parseFloat(document.getElementById('principal').value);
    const annualRate = parseFloat(document.getElementById('annualRate').value);
    const years = parseInt(document.getElementById('years').value);
    const months = parseInt(document.getElementById('months').value) || 0;
    const startDate = new Date(document.getElementById('startDate').value);
    const repaymentType = document.querySelector('input[name="repaymentType"]:checked').value;

    const totalMonths = years * 12 + months;

    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > totalMonths) {
      throw new Error(`月数は1から${totalMonths}の間で入力してください`);
    }

    const details = LoanCalculator.getMonthlyDetails(principal, annualRate, totalMonths, targetMonth, startDate, repaymentType);
    const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });

    const detailsBox = document.getElementById('monthlyDetailsResult');
    detailsBox.innerHTML = `
      <h4>${targetMonth}ヶ月目の詳細情報</h4>
      <div class="details-item">
        <span class="details-label">返済日</span>
        <span class="details-value">${details.paymentDate}</span>
      </div>
      <div class="details-item">
        <span class="details-label">毎月返済額</span>
        <span class="details-value">${formatter.format(details.monthlyPayment)}</span>
      </div>
      <div class="details-item">
        <span class="details-label">元本返済額</span>
        <span class="details-value">${formatter.format(details.principalPayment)}</span>
      </div>
      <div class="details-item">
        <span class="details-label">利息返済額</span>
        <span class="details-value">${formatter.format(details.interestPayment)}</span>
      </div>
      <div class="details-item">
        <span class="details-label">残高</span>
        <span class="details-value">${formatter.format(details.remainingBalance)}</span>
      </div>
    `;
    detailsBox.style.display = 'block';

  } catch (error) {
    showError('詳細情報の取得に失敗: ' + error.message);
  }
}

// ========== Analyzer Functions ==========
function handleAnalyzerSubmit(e) {
  e.preventDefault();

  try {
    const startDate = new Date(document.getElementById('analyzeStartDate').value);
    const monthlyPayment = parseFloat(document.getElementById('analyzeMonthlyPayment').value);
    const principal = document.getElementById('analyzePrincipal').value ? parseFloat(document.getElementById('analyzePrincipal').value) : null;
    const remainingBalance = document.getElementById('analyzeRemainingBalance').value ? parseFloat(document.getElementById('analyzeRemainingBalance').value) : null;
    const elapsedMonths = document.getElementById('analyzeElapsedMonths').value ? parseInt(document.getElementById('analyzeElapsedMonths').value) : 12;
    const repaymentType = document.querySelector('input[name="analyzeRepaymentType"]:checked').value;

    // バリデーション
    if (isNaN(startDate.getTime())) throw new Error('開始日を正しく入力してください');
    if (isNaN(monthlyPayment) || monthlyPayment <= 0) throw new Error('毎月の返済額を正しく入力してください');
    if (!principal && !remainingBalance) throw new Error('元借入額または現在の残高を入力してください');

    // 分析を実行
    const analysisParams = {
      startDate,
      monthlyPayment,
      principal: principal || remainingBalance,
      remainingBalance,
      elapsedMonths
    };

    const result = LoanAnalyzer.analyzeCurrentLoan(analysisParams, repaymentType);

    // 結果を表示
    displayAnalyzerResults(result);

    // 結果エリアを表示
    document.getElementById('analyzerResults').style.display = 'block';

  } catch (error) {
    showError('分析エラー: ' + error.message);
  }
}

function displayAnalyzerResults(result) {
  const formatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
  const repaymentTypeLabel = {
    'equal_payment': '元利均等返済',
    'equal_principal': '元金均等返済',
    'auto': '自動判定'
  };

  document.getElementById('estimatedRateResult').textContent = result.estimatedRate.toFixed(2) + '%';
  document.getElementById('payoffDateResult').textContent = result.payoffDate;
  document.getElementById('remainingMonthsResult').textContent = result.remainingMonths + 'ヶ月';
  document.getElementById('repaymentTypeResult').textContent = repaymentTypeLabel[result.repaymentType] || result.repaymentType;

  // 詳細情報を表示
  const detailsBox = document.getElementById('analyzerDetailsResult');
  detailsBox.innerHTML = `
    <h4>詳細情報</h4>
    <div class="details-item">
      <span class="details-label">推定金利</span>
      <span class="details-value">${result.estimatedRate.toFixed(2)}%</span>
    </div>
    <div class="details-item">
      <span class="details-label">完済予定日</span>
      <span class="details-value">${result.payoffDate}</span>
    </div>
    <div class="details-item">
      <span class="details-label">残り期間</span>
      <span class="details-value">${result.remainingMonths}ヶ月</span>
    </div>
    <div class="details-item">
      <span class="details-label">元本金額</span>
      <span class="details-value">${formatter.format(result.principalAmount)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">返済方式</span>
      <span class="details-value">${repaymentTypeLabel[result.repaymentType]}</span>
    </div>
  `;
  detailsBox.style.display = 'block';
}

// ========== Utility Functions ==========
function showError(message) {
  // エラーメッセージを表示
  const messageDiv = document.createElement('div');
  messageDiv.className = 'error-message';
  messageDiv.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(messageDiv, container.firstChild);

  // 5秒後に自動削除
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function showSuccess(message) {
  // 成功メッセージを表示
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(messageDiv, container.firstChild);

  // 3秒後に自動削除
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
