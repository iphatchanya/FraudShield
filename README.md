# FraudShield

FraudShield - Early Detection of Frozen, Mule, and Fraudulent Accounts Before Settlement

URL: https://iphatchanya.github.io/FraudShield/

📘 **Prototype for subject BA7602 – Business Intelligence and Analytics for Manager**  
⚠️ This is a demo for coursework. It does not connect to real banking systems and must not be used in production.

## Features

- **Account-level risk checks**: Upload a CSV of bank accounts + features and get instant risk predictions.
- **Modern UI**: Clean, responsive dashboard with dark/light mode.
- **Visual analytics**: Prediction split and confidence distribution.
- **Explainable output**: Colour-coded risk levels (Safe / Low / Medium / High).
- **Sample data**: One-click generator for Thai-style accounts (e.g., SCB-123-456-7890).

## Technology Stack

**Frontend:**
- Vite + JavaScript
- Tailwind CSS
- Chart.js


## Project Structure

```
├── public/
│   └── fraud-icon.png
├── src/
│   ├── chart-manager.js
│   ├── fraud-detector.js
│   ├── main.js
│   ├── style.css
│   └── ui-manager.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── test.csv
└── vite.config.js
```

## Quick Start

```bash
npm install
npm run dev
```

## Credits
This project is adapted from [Fraud-Detection-Dashboard](https://github.com/Param-10/Fraud-Detection-Dashboard)  
by [Param-10] under [LICENSE type].
