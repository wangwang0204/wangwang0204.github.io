// 2. 分類引擎 (支援多項式邏輯回歸 & KNN)
class ClassificationEngine {
    constructor() { 
        // weights will be a matrix: numClasses x numFeatures
        this.weights = [];
        this.trainingData = [];
    }

    // 將 (x, y) 擴展為多項式特徵向量 [1, x, y, x^2, xy, y^2...]
    getFeatures(x, y, degree) {
        let features = [1]; // Bias term
        for (let i = 1; i <= degree; i++) {
            for (let j = 0; j <= i; j++) {
                features.push(Math.pow(x, i - j) * Math.pow(y, j));
            }
        }
        return features;
    }

    // Softmax function for converting scores to probabilities
    softmax(scores) {
        const maxScore = Math.max(...scores); // For numerical stability
        const exps = scores.map(s => Math.exp(s - maxScore));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sumExps);
    }

    train(data, config) {
        this.trainingData = data;
        if (config.model === 'logistic') {
            this.trainSoftmax(data, config.polyDegree, config.lambda);
        }
        // KNN training is just storing data, so no explicit call needed here.
    }

    // Replaces the old OvR/SGD training with Multinomial Logistic Regression (Softmax)
    trainSoftmax(data, degree, lambda) {
        const numClasses = 3;
        const numFeatures = this.getFeatures(0, 0, degree).length;
        
        // Initialize weights: 3 classes, each with a vector of zeros
        this.weights = Array(numClasses).fill(0).map(() => Array(numFeatures).fill(0));

        const learningRate = 0.1;
        const iterations = 500; // Increased iterations for better convergence

        // Batch Gradient Descent
        for (let iter = 0; iter < iterations; iter++) {
            // Gradient matrix: numClasses x numFeatures
            let gradients = Array(numClasses).fill(0).map(() => Array(numFeatures).fill(0));

            if (data.length === 0) continue;

            for (const p of data) {
                const features = this.getFeatures(p.x, p.y, degree);
                
                // 1. Calculate scores for each class
                const scores = this.weights.map(classWeights => 
                    features.reduce((sum, f, j) => sum + f * classWeights[j], 0)
                );

                // 2. Get probabilities using softmax
                const probabilities = this.softmax(scores);

                // 3. Calculate error and accumulate gradients for each class
                for (let k = 0; k < numClasses; k++) {
                    const isClassK = (p.class === k ? 1 : 0);
                    const error = probabilities[k] - isClassK;
                    for (let j = 0; j < numFeatures; j++) {
                        gradients[k][j] += error * features[j];
                    }
                }
            }

            // 4. Update weights for each class
            for (let k = 0; k < numClasses; k++) {
                for (let j = 0; j < numFeatures; j++) {
                    const regularization = (j > 0) ? (lambda / data.length) * this.weights[k][j] : 0;
                    this.weights[k][j] -= (learningRate / data.length) * (gradients[k][j] + regularization);
                }
            }
        }
    }

    predictProbabilities(x, y, config) {
        if (config.model === 'logistic') {
            if (!this.weights || this.weights.length === 0 || this.weights[0].length === 0) {
                return [1/3, 1/3, 1/3];
            }
            const feats = this.getFeatures(x, y, config.polyDegree);
            const scores = this.weights.map(classWeights => 
                feats.reduce((sum, f, i) => sum + f * classWeights[i], 0)
            );
            return this.softmax(scores);
        
        } else { // KNN
            if (this.trainingData.length === 0) return [1/3, 1/3, 1/3];
            
            const dists = this.trainingData.map(p => ({
                dist: Math.sqrt((p.x - x)**2 + (p.y - y)**2),
                class: p.class
            })).sort((a, b) => a.dist - b.dist);
            
            const k = Math.min(config.k, dists.length);
            if (k === 0) return [1/3, 1/3, 1/3];
            const neighbors = dists.slice(0, k);
            const counts = [0, 0, 0];
            neighbors.forEach(n => counts[n.class]++);
            return counts.map(c => c/k);
        }
    }

    predictClass(x, y, config) {
        const probs = this.predictProbabilities(x, y, config);
        // Find the index of the maximum probability
        let maxProb = -1;
        let predictedClass = -1;
        for (let i = 0; i < probs.length; i++) {
            if (probs[i] > maxProb) {
                maxProb = probs[i];
                predictedClass = i;
            }
        }
        return predictedClass;
    }
}
