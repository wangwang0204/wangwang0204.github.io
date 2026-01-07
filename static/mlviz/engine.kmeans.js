// --- KMeans Engine (2D, kmeans++) ---
class KMeansEngine {
  constructor() {
    this.centroids = [];
    this.assignments = [];
    this.inertia = 0;
  }

  train(data, k, initCentroids = null) {
    if (!data || data.length === 0 || k <= 0) {
      this.centroids = [];
      this.assignments = [];
      this.inertia = 0;
      return;
    }

    const clampedK = Math.max(1, Math.min(k, data.length));
    let centroids = this._initCentroids(data, clampedK, initCentroids);
    let assignments = new Array(data.length).fill(0);

    const maxIter = 50;
    const epsilon = 1e-4;
    for (let iter = 0; iter < maxIter; iter++) {
      // Assign
      for (let i = 0; i < data.length; i++) {
        assignments[i] = this._nearestCentroidIndex(data[i], centroids);
      }

      // Update
      const sums = Array(clampedK).fill(0).map(() => ({ x: 0, y: 0, n: 0 }));
      for (let i = 0; i < data.length; i++) {
        const idx = assignments[i];
        sums[idx].x += data[i].x;
        sums[idx].y += data[i].y;
        sums[idx].n += 1;
      }

      let maxShift = 0;
      for (let c = 0; c < clampedK; c++) {
        if (sums[c].n === 0) {
          const rand = data[Math.floor(Math.random() * data.length)];
          const dx = rand.x - centroids[c].x;
          const dy = rand.y - centroids[c].y;
          maxShift = Math.max(maxShift, Math.hypot(dx, dy));
          centroids[c] = { x: rand.x, y: rand.y };
          continue;
        }
        const newX = sums[c].x / sums[c].n;
        const newY = sums[c].y / sums[c].n;
        const dx = newX - centroids[c].x;
        const dy = newY - centroids[c].y;
        maxShift = Math.max(maxShift, Math.hypot(dx, dy));
        centroids[c] = { x: newX, y: newY };
      }

      if (maxShift < epsilon) break;
    }

    // Inertia
    let inertia = 0;
    for (let i = 0; i < data.length; i++) {
      const c = centroids[assignments[i]];
      const dx = data[i].x - c.x;
      const dy = data[i].y - c.y;
      inertia += dx * dx + dy * dy;
    }

    this.centroids = centroids;
    this.assignments = assignments;
    this.inertia = inertia;
  }

  getCentroids() {
    return this.centroids || [];
  }

  getAssignments() {
    return this.assignments || [];
  }

  getInertia() {
    return this.inertia || 0;
  }

  _initCentroids(data, k, initCentroids) {
    if (Array.isArray(initCentroids) && initCentroids.length === k) {
      return initCentroids.map(c => ({ x: c.x, y: c.y }));
    }

    // kmeans++ initialization
    const centroids = [];
    const first = data[Math.floor(Math.random() * data.length)];
    centroids.push({ x: first.x, y: first.y });

    while (centroids.length < k) {
      const distances = data.map(p => {
        const idx = this._nearestCentroidIndex(p, centroids);
        const c = centroids[idx];
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        return dx * dx + dy * dy;
      });
      const total = distances.reduce((a, b) => a + b, 0);
      if (total === 0) {
        const rand = data[Math.floor(Math.random() * data.length)];
        centroids.push({ x: rand.x, y: rand.y });
        continue;
      }
      let r = Math.random() * total;
      for (let i = 0; i < data.length; i++) {
        r -= distances[i];
        if (r <= 0) {
          centroids.push({ x: data[i].x, y: data[i].y });
          break;
        }
      }
    }

    return centroids;
  }

  _nearestCentroidIndex(p, centroids) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const c = centroids[i];
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }
}
