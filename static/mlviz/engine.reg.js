// 1. 回歸引擎
class RegressionEngine {
    constructor() { this.weights = { m: 0, b: 0 }; }
    
    predict(x) { return this.weights.m * x + this.weights.b; }
    
    train(points, model, lambda = 0) {
        if (points.length < 2) { this.weights = { m: 0, b: 0 }; return; }
        
        if (model === 'ridge') {
            this.solveRidge(points, lambda);
        } else if (model === 'absolute') {
            this.solveLAD(points); // Least Absolute Deviations
        } else {
            this.solveOLS(points); // Ordinary Least Squares
        }
    }

    solveOLS(points) {
        const n = points.length;
        const sumX = d3.sum(points, d => d.x);
        const sumY = d3.sum(points, d => d.y);
        const sumXY = d3.sum(points, d => d.x * d.y);
        const sumXX = d3.sum(points, d => d.x * d.x);
        
        const denominator = (n * sumXX - sumX * sumX);
        if (denominator === 0) return;
        
        const m = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY - m * sumX) / n;
        this.weights = { m, b };
    }

    solveRidge(points, lambda) {
        // Simplified 1D Ridge
        const xBar = d3.mean(points, d => d.x);
        const yBar = d3.mean(points, d => d.y);
        let num = 0, den = 0;
        points.forEach(p => {
            num += (p.x - xBar) * (p.y - yBar);
            den += Math.pow(p.x - xBar, 2);
        });
        const m = num / (den + lambda); // Penalty on slope
        const b = yBar - m * xBar;
        this.weights = { m, b };
    }
    
    solveLAD(points) {
        // IRLS approximation for Median Regression
        // Start with OLS
        this.solveOLS(points);
        let m = this.weights.m, b = this.weights.b;
        
        for(let i=0; i<20; i++) {
            let sumW = 0, sumWX = 0, sumWY = 0, sumWXX = 0, sumWXY = 0;
            points.forEach(p => {
                let resid = Math.abs(p.y - (m * p.x + b));
                let w = 1 / Math.max(resid, 0.0001); // Avoid division by zero
                sumW += w; sumWX += w*p.x; sumWY += w*p.y; sumWXX += w*p.x*p.x; sumWXY += w*p.x*p.y;
            });
            const det = sumW * sumWXX - sumWX * sumWX;
            if(Math.abs(det) < 1e-6) break;
            m = (sumW * sumWXY - sumWX * sumWY) / det;
            b = (sumWY * sumWXX - sumWX * sumWXY) / det;
        }
        this.weights = { m, b };
    }

    calcR2(points) {
        if (points.length < 2) return 0;
        const yMean = d3.mean(points, d => d.y);
        const ssTot = d3.sum(points, d => Math.pow(d.y - yMean, 2));
        const ssRes = d3.sum(points, d => Math.pow(d.y - this.predict(d.x), 2));
        return ssTot === 0 ? 0 : Math.max(0, 1 - (ssRes / ssTot));
    }
}
