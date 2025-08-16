export class FraudDetector {
    constructor() {
        this.expectedFeatures = [
            'Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9',
            'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18',
            'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27',
            'V28', 'Accounts'
        ];

        this.modelWeights = {
            'V1': -0.2, 'V2': 0.15, 'V3': -0.3, 'V4': 0.25, 'V5': -0.1,
            'V6': 0.2, 'V7': -0.25, 'V8': 0.1, 'V9': -0.15, 'V10': 0.3,
            'V11': -0.2, 'V12': 0.35, 'V13': -0.1, 'V14': 0.4, 'V15': -0.3,
            'V16': 0.2, 'V17': -0.25, 'V18': 0.15, 'V19': -0.2, 'V20': 0.1,
            'V21': -0.15, 'V22': 0.25, 'V23': -0.3, 'V24': 0.2, 'V25': -0.1,
            'V26': 0.15, 'V27': -0.2, 'V28': 0.1,
            'Accounts': 0.0001,
            'Time': 0.00001
        };
        this.bias = -0.5;
    }

    digitsFromAccount(acc) {
        return String(acc ?? '').replace(/\D/g, '');
    }

    hashString(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    accountToNumericFeature(row) {
        if (row?.Accounts_numeric !== undefined) {
            const n = Number(row.Accounts_numeric);
            if (Number.isFinite(n)) return Math.log(n + 1) / 10;
        }

        const raw = row?.Accounts ?? '';
        const digits = this.digitsFromAccount(raw);

        if (digits.length) {
            const tail = digits.slice(-10);
            const asInt = parseInt(tail, 10);
            return Math.log(asInt + 1) / 10;
        }

        const h = this.hashString(String(raw));
        return Math.log((h % 1_000_000_000) + 1) / 10;
    }

    async predict(data) {
        const out = [];
        for (const row of data) {
            const features = this.extractFeatures(row);
            const scaled = this.scaleFeatures(row, features);
            const score = this.calculateScore(scaled);
            const prob = this.sigmoid(score);
            const prediction = prob > 0.5 ? 1 : 0;

            out.push({
                prediction,
                confidence: prediction === 1 ? prob : 1 - prob,
                score
            });
        }
        return out;
    }

    extractFeatures(row) {
        const features = {};
        this.expectedFeatures.forEach(f => {
            features[f] = row?.[f] ?? 0;
        });
        return features;
    }

    scaleFeatures(row, features) {
        const scaled = {};
        for (const key of Object.keys(features)) {
            if (key === 'Accounts') {
                scaled[key] = this.accountToNumericFeature(row);
            } else if (key === 'Time') {
                const num = Number(features[key]);
                scaled[key] = Number.isFinite(num) ? (num / 172800) : 0;
            } else {
                const num = Number(features[key]);
                scaled[key] = Number.isFinite(num) ? num : 0;
            }
        }
        return scaled;
    }

    calculateScore(features) {
        let s = this.bias;
        for (const k of Object.keys(this.modelWeights)) {
            s += (features[k] || 0) * this.modelWeights[k];
        }
        return s;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
}
