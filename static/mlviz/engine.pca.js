// --- PCA Engine (2D, no external deps) ---
class PCAEngine {
  constructor() {
    this.mean = [0, 0];         // [mx, my]
    this.W = null;              // 2x2, columns are eigenvectors: [[w11,w12],[w21,w22]]
    this.variance = [0, 0];     // proportions
    this.eigenvalues = [0, 0];  // [lambda1, lambda2]
    this.transformed = [];      // [{x, y, i}]
  }

  train(data) {
    if (!data || data.length < 2) {
      this.mean = [0, 0];
      this.W = null;
      this.variance = [0, 0];
      this.eigenvalues = [0, 0];
      this.transformed = [];
      return;
    }

    const n = data.length;

    // 1) mean
    const mx = data.reduce((s, p) => s + p.x, 0) / n;
    const my = data.reduce((s, p) => s + p.y, 0) / n;
    this.mean = [mx, my];

    // 2) centered
    const Xc = data.map(p => [p.x - mx, p.y - my]);

    // 3) covariance (sample, divide by n-1)
    let sxx = 0, syy = 0, sxy = 0;
    for (const r of Xc) {
      sxx += r[0] * r[0];
      syy += r[1] * r[1];
      sxy += r[0] * r[1];
    }
    const denom = Math.max(1, n - 1);
    sxx /= denom;
    syy /= denom;
    sxy /= denom;

    // cov = [[a,b],[b,d]]
    const a = sxx, b = sxy, d = syy;

    // 4) eigenvalues for 2x2 symmetric matrix
    const tr = a + d;
    const detTerm = Math.sqrt(((a - d) * (a - d)) / 4 + b * b);
    const l1 = tr / 2 + detTerm; // larger
    const l2 = tr / 2 - detTerm;

    // 5) eigenvectors
    const v1 = this._eigenvector(a, b, d, l1);
    const v2 = this._eigenvector(a, b, d, l2);

    // W columns: [v1 v2]
    this.W = [
      [v1[0], v2[0]],
      [v1[1], v2[1]]
    ];

    // 6) explained variance
    const total = (l1 + l2);
    this.variance = total > 0 ? [l1 / total, l2 / total] : [0, 0];
    this.eigenvalues = [l1, l2];

    // 7) project
    this.transformed = Xc.map((r, i) => {
      const z1 = r[0] * this.W[0][0] + r[1] * this.W[1][0];
      const z2 = r[0] * this.W[0][1] + r[1] * this.W[1][1];
      return { x: z1, y: z2, i };
    });
  }

  getExplainedVariance() {
    return this.variance || [0, 0];
  }

  getEigenvalues() {
    return this.eigenvalues || [0, 0];
  }

  getTransformedData() {
    return this.transformed || [];
  }

  // Inverse: given (pc1, pc2) -> (x, y) in original space using current W, mean
  inverseTransform(pc1, pc2) {
    if (!this.W) return { x: pc1, y: pc2 };

    const mx = this.mean[0], my = this.mean[1];
    const x = mx + this.W[0][0] * pc1 + this.W[0][1] * pc2;
    const y = my + this.W[1][0] * pc1 + this.W[1][1] * pc2;
    return { x, y };
  }

  _eigenvector(a, b, d, lambda) {
    // If b ~ 0, matrix is diagonal
    if (Math.abs(b) < 1e-12) {
      // choose axis with larger variance
      if (a >= d) return [1, 0];
      return [0, 1];
    }
    // vector [b, lambda - a]
    let x = b;
    let y = lambda - a;
    const norm = Math.hypot(x, y) || 1;
    x /= norm; y /= norm;
    return [x, y];
  }
}
