import './style.css';
import { FraudDetector } from './fraud-detector.js';
import { UIManager } from './ui-manager.js';
import { ChartManager } from './chart-manager.js';

class App {
  constructor() {
    this.fraudDetector = new FraudDetector();
    this.uiManager = new UIManager();
    this.chartManager = new ChartManager();
    this.horseArea = null;
    this.warningTimer = null;

    this.init();
  }

  init() {
    this.uiManager.init();
    this.setupEventListeners();
    this.initHorse();
  }

  setupEventListeners() {

    setTimeout(() => {
      this.setupFileUpload();
      this.setupSampleData();
      this.setupThemeToggle();
    }, 100);
  }

  initHorse() {
    document.documentElement.style.setProperty('--run-duration', '14s');
    this.horseArea = document.getElementById('horseArea');
    const schedule = () => {
      const nextDelay = 3000 + Math.random() * 4000;
      this.warningTimer = setTimeout(() => {
        if (Math.random() < 0.6) this.spawnWarning();
        schedule();
      }, nextDelay);
    };
    schedule();

    window.addEventListener('beforeunload', () => {
      if (this.warningTimer) clearTimeout(this.warningTimer);
    });
  }

  spawnWarning() {
    if (!this.horseArea) return;

    const warn = document.createElement('span');
    warn.textContent = '⚠️';
    warn.className = 'warning';
    warn.style.left = `${Math.random() * 80 - 40}px`;

    this.horseArea.appendChild(warn);
    setTimeout(() => warn.remove(), 1000);
  }

  setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const chooseFileBtn = document.getElementById('choose-file-btn');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
    }

    if (chooseFileBtn) {
      chooseFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
      });
    }

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        this.handleFileUpload(e.dataTransfer.files[0]);
      });

      dropZone.addEventListener('click', (e) => {
        if (e.target === dropZone || !e.target.closest('#choose-file-btn')) {
          fileInput?.click();
        }
      });
    }
  }

  setupSampleData() {
    const sampleButton = document.getElementById('load-sample');
    if (sampleButton) {
      sampleButton.addEventListener('click', () => {
        this.loadSampleData();
      });
    }
  }

  async handleFileUpload(file) {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      this.uiManager.showError('Please upload a CSV file');
      return;
    }

    this.uiManager.showLoading(true);

    try {
      const text = await file.text();
      const csvData = this.parseCSV(text);
      await this.processData(csvData);
    } catch (error) {
      console.error('Error processing file:', error);
      this.uiManager.showError('Error processing file: ' + error.message);
    } finally {
      this.uiManager.showLoading(false);
    }
  }

  parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], data: [] };

    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map((h) => h.trim());

    const numericHeaders = new Set([
      'Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9',
      'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18',
      'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28'
    ]);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw) continue;

      const values = raw.split(',');
      const row = {};

      headers.forEach((header, index) => {
        const cell = (values[index] ?? '').trim();

        if (header.toLowerCase() === 'accounts') {
          row[header] = cell;
        } else if (numericHeaders.has(header)) {
          const num = Number(cell);
          row[header] = Number.isFinite(num) ? num : 0;
        } else {
          row[header] = cell;
        }
      });

      data.push(row);
    }

    return { headers, data };
  }

  async processData(csvData) {
    try {
      const predictions = await this.fraudDetector.predict(csvData.data);
      this.displayResults(csvData, predictions);
    } catch (error) {
      console.error('Error processing data:', error);
      this.uiManager.showError('Error processing data: ' + error.message);
    }
  }

  displayResults(csvData, predictions) {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.classList.remove('hidden');
    }

    const totalBankAccounts = predictions.length;
    const fraudulentCount = predictions.filter((p) => p.prediction === 1).length;
    const legitimateCount = totalBankAccounts - fraudulentCount;
    const fraudRate = totalBankAccounts > 0 ? ((fraudulentCount / totalBankAccounts) * 100).toFixed(1) : '0';

    this.updateElement('total-bankaccounts', totalBankAccounts);
    this.updateElement('fraudulent-count', fraudulentCount);
    this.updateElement('legitimate-count', legitimateCount);
    this.updateElement('fraud-rate', fraudRate + '%');

    this.chartManager.createPieChart(fraudulentCount, legitimateCount);
    this.chartManager.createConfidenceChart(predictions);

    this.displayAccountsTable(csvData, predictions);
  }

  updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  displayAccountsTable(csvData, predictions) {
    const tableContainer = document.getElementById('accounts-table');
    if (!tableContainer) return;

    let html = `
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Row</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank Account</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prediction</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confidence</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk Level</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
    `;

    predictions.forEach((pred, index) => {
      const row = csvData.data[index] || {};
      const account = row.Accounts ?? '—';
      const isFraud = pred.prediction === 1;
      const confidence = (pred.confidence * 100).toFixed(1);
      const riskLevel = this.getRiskLevel(pred.confidence, pred.prediction);

      html += `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${index + 1}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">${account}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${isFraud ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}">
              ${isFraud ? 'Fraudulent' : 'Legitimate'}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${confidence}%</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${riskLevel.class}">
              ${riskLevel.text}
            </span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    tableContainer.innerHTML = html;
  }

  getRiskLevel(confidence, prediction) {
    if (prediction === 1) {
      if (confidence > 0.8) return { text: 'High Risk', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
      if (confidence > 0.6) return { text: 'Medium Risk', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
      return { text: 'Low Risk', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
    }
    return { text: 'Safe', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }

  async loadSampleData() {
    this.uiManager.showLoading(true);
    try {
      const sampleData = this.generateSampleData(20);
      await this.processData(sampleData);
    } catch (error) {
      console.error('Error loading sample data:', error);
      this.uiManager.showError('Error loading sample data: ' + error.message);
    } finally {
      this.uiManager.showLoading(false);
    }
  }

  randomAccount() {
    const banks = ['SCB', 'KTB', 'BBL', 'KBANK', 'TTB', 'BAY', 'GSB', 'CIMB', 'UOB', 'TISCO'];
    const b = banks[Math.floor(Math.random() * banks.length)];
    const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
    const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return `${b}-${formatted}`;
  }

  generateSampleData(n = 10) {
    const headers = [
      'Accounts', 'Time',
      'V1','V2','V3','V4','V5','V6','V7','V8','V9',
      'V10','V11','V12','V13','V14','V15','V16','V17','V18',
      'V19','V20','V21','V22','V23','V24','V25','V26','V27','V28'
    ];

    const data = [];
    for (let i = 0; i < n; i++) {
      const row = {};
      row['Accounts'] = this.randomAccount();
      row['Time'] = Math.random() * 172800;

      for (let k = 1; k <= 28; k++) {
        row[`V${k}`] = (Math.random() - 0.5) * 4;
      }
      data.push(row);
    }

    return { headers, data };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
