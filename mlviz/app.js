// --- 主應用程式控制器 (App Controller) ---

class App {
    constructor() {
        this.mode = 'regression'; // 'regression' | 'classification' | 'pca' | 'kmeans'
        this.data = [];
        
        // Configuration State
        this.config = {
            xMin: 0, xMax: 20,
            yMin: 0, yMax: 20,
            regAxisX: 'x', regAxisY: 'y',
            clsAxisX: 'x1', clsAxisY: 'x2',
            pcaAxisX: 'PC1', pcaAxisY: 'PC2',
            kmeansAxisX: 'x', kmeansAxisY: 'y',
            cls0Name: 'Class 0', cls1Name: 'Class 1',
            margin: {top: 30, right: 30, bottom: 50, left: 50},
            regression: { model: 'ols', lambda: 1 },
            classification: { activeClass: 0, model: 'logistic', polyDegree: 1, lambda: 0.1, k: 3 },
            kmeans: { k: 3 }
        };

        this.regEngine = new RegressionEngine();
        this.clsEngine = new ClassificationEngine();
        this.pcaEngine = new PCAEngine();
        this.kmeansEngine = new KMeansEngine();
        this.kmeansCentroids = null;
        this.kmeansElbowMax = 8;
        this.elbowData = [];
        
        this.initDOM();
        this.initViz();
        this.setupListeners();
        this.updateMetricTooltip();
        
        // Initial Dummy Data
        this.data = [{x: 4, y: 5}, {x: 8, y: 9}, {x: 12, y: 11}, {x: 15, y: 16}];
        this.update();

        this.setInitialSliderState('.top-nav .segmented-control');
        this.setInitialTabSliderState('.tab-switcher');
    }

    setInitialSliderState(selector) {
        const container = document.querySelector(selector);
        if (!container) return;
        const activeBtn = container.querySelector('.seg-btn.active');
        const slider = container.querySelector('.seg-slider');
        if (activeBtn && slider) {
            requestAnimationFrame(() => {
                slider.style.width = `${activeBtn.offsetWidth}px`;
                // The container has 4px padding, and the slider has left: 4px.
                // The button's offsetLeft is relative to the container's padding box.
                // So we just need to subtract the slider's own `left` value.
                slider.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
            });
        }
    }

    setInitialTabSliderState(selector) {
        const containers = document.querySelectorAll(selector);
        if (!containers.length) return;
        containers.forEach(container => {
            const activeBtn = container.querySelector('.tab-btn.active');
            const slider = container.querySelector('.tab-slider');
            if (!activeBtn || !slider) return;
            requestAnimationFrame(() => {
                slider.style.width = `${activeBtn.offsetWidth}px`;
                slider.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
            });
        });
    }

    updateTabSlider(container) {
        if (!container) return;
        const activeBtn = container.querySelector('.tab-btn.active');
        const slider = container.querySelector('.tab-slider');
        if (!activeBtn || !slider) return;
        slider.style.width = `${activeBtn.offsetWidth}px`;
        slider.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
    }

    resetForMode(mode) {
        this.data = [];
        this.kmeansCentroids = null;
        if (mode === 'regression') {
            this.config.regAxisX = 'x';
            this.config.regAxisY = 'y';
            this.config.xMin = 0;
            this.config.xMax = 20;
            this.config.yMin = 0;
            this.config.yMax = 20;
            d3.select("#reg-x-name").property("value", this.config.regAxisX);
            d3.select("#reg-y-name").property("value", this.config.regAxisY);
            d3.select("#reg-xmin").property("value", this.config.xMin);
            d3.select("#reg-xmax").property("value", this.config.xMax);
            d3.select("#reg-ymin").property("value", this.config.yMin);
            d3.select("#reg-ymax").property("value", this.config.yMax);
        } else if (mode === 'classification') {
            this.config.clsAxisX = 'x1';
            this.config.clsAxisY = 'x2';
            this.config.xMin = 0;
            this.config.xMax = 20;
            this.config.yMin = 0;
            this.config.yMax = 20;
            d3.select("#cls-x-name").property("value", this.config.clsAxisX);
            d3.select("#cls-y-name").property("value", this.config.clsAxisY);
            d3.select("#cls-xmin").property("value", this.config.xMin);
            d3.select("#cls-xmax").property("value", this.config.xMax);
            d3.select("#cls-ymin").property("value", this.config.yMin);
            d3.select("#cls-ymax").property("value", this.config.yMax);
        } else if (mode === 'pca') {
            this.config.pcaAxisX = 'PC1';
            this.config.pcaAxisY = 'PC2';
            this.config.xMin = -10;
            this.config.xMax = 10;
            this.config.yMin = -10;
            this.config.yMax = 10;
            d3.select("#pca-x-name").property("value", this.config.pcaAxisX);
            d3.select("#pca-y-name").property("value", this.config.pcaAxisY);
            d3.select("#pca-xmin").property("value", this.config.xMin);
            d3.select("#pca-xmax").property("value", this.config.xMax);
            d3.select("#pca-ymin").property("value", this.config.yMin);
            d3.select("#pca-ymax").property("value", this.config.yMax);
        } else if (mode === 'kmeans') {
            this.config.kmeansAxisX = 'x';
            this.config.kmeansAxisY = 'y';
            this.config.xMin = 0;
            this.config.xMax = 20;
            this.config.yMin = 0;
            this.config.yMax = 20;
            this.config.kmeans.k = 3;
            d3.select("#kmeans-x-name").property("value", this.config.kmeansAxisX);
            d3.select("#kmeans-y-name").property("value", this.config.kmeansAxisY);
            d3.select("#kmeans-xmin").property("value", this.config.xMin);
            d3.select("#kmeans-xmax").property("value", this.config.xMax);
            d3.select("#kmeans-ymin").property("value", this.config.yMin);
            d3.select("#kmeans-ymax").property("value", this.config.yMax);
        }
    }

    initDOM() {
        // Cache DOM elements
        this.els = {
            metricVal: d3.select("#metrics-value"),
            metricLabel: d3.select("#metrics-label"),
            metricCard: d3.select("#metrics-card"),
            slider: d3.select(".seg-slider"),
            regPanel: d3.select("#regression-panel"),
            clsPanel: d3.select("#classification-panel"),
            pcaPanel: d3.select("#pca-panel"),
            kmeansPanel: d3.select("#kmeans-panel"),
            polyControl: d3.select("#poly-degree-control"),
            logLambdaControl: d3.select("#logistic-lambda-control"),
            knnControl: d3.select("#knn-k-control"),
            lambdaRegControl: d3.select("#lambda-control-reg"),
            emptyPrompt: d3.select("#empty-state-prompt"),
            elbowContainer: d3.select("#elbow-chart")
        };

        if (!this.els.elbowContainer.empty()) {
            this.elbowSvg = this.els.elbowContainer.append("svg").attr("class", "elbow-svg");
        }
    }

    initViz() {
        const container = document.getElementById('viz');
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // 1. Canvas Layer (For Decision Boundary - High Performance)
        this.bgCanvas = d3.select("#viz").append("canvas")
            .attr("width", this.width)
            .attr("height", this.height)
            .style("position", "absolute")
            .style("top", 0)
            .style("left", 0)
            .node();
        this.ctx = this.bgCanvas.getContext('2d');

        // 2. SVG Layer (For Axes & Points)
        this.svg = d3.select("#viz").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("position", "absolute")
            .style("z-index", 5)
            .on("click", (e) => this.handleCanvasClick(e));

        this.defs = this.svg.append("defs");
        this.defs.append("marker")
            .attr("id", "pc1-arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "var(--class-a-blue)");

        this.defs.append("marker")
            .attr("id", "pc2-arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "var(--class-b-orange)");

        // Scales
        this.xScale = d3.scaleLinear().range([this.config.margin.left, this.width - this.config.margin.right]);
        this.yScale = d3.scaleLinear().range([this.height - this.config.margin.bottom, this.config.margin.top]);

        // Axis Groups
        this.gridG = this.svg.append("g").attr("class", "grid-layer");
        this.xAxisG = this.svg.append("g").attr("transform", `translate(0,${this.height - this.config.margin.bottom})`);
        this.yAxisG = this.svg.append("g").attr("transform", `translate(${this.config.margin.left},0)`);

        // Axis Labels
        this.xLabel = this.svg.append("text").attr("class", "axis-label")
            .attr("x", this.width/2).attr("y", this.height - 10).style("text-anchor", "middle");
        this.yLabel = this.svg.append("text").attr("class", "axis-label")
            .attr("transform", "rotate(-90)").attr("y", 20).attr("x", -this.height/2).style("text-anchor", "middle");

        // Data Layers
        this.linePath = this.svg.append("path").attr("class", "regression-line");
        this.errorLinesG = this.svg.append("g").attr("class", "error-lines-layer");
        this.errorSquaresG = this.svg.append("g").attr("class", "error-squares-layer");
        this.pointsG = this.svg.append("g").attr("class", "points-layer");
        this.pcAxesG = this.svg.append("g").attr("class", "pca-axes-layer");
        this.pcaProjectionG = this.svg.append("g").attr("class", "pca-projection-layer");
        this.kmeansCentroidsG = this.svg.append("g").attr("class", "kmeans-centroids-layer");
        
        this.pointTooltip = d3.select("#point-tooltip");
        this.globalTooltip = d3.select("#global-tooltip");
    }

    setupListeners() {
        // 1. Mode Switcher
        d3.selectAll(".seg-btn").on("click", (e) => {
            const mode = e.target.dataset.mode;
            this.setMode(mode);
        });

        // 2. Class Painter (Key 1, 2, 3)
        document.addEventListener("keydown", (e) => {
            if (this.mode === 'classification' && ['1','2'].includes(e.key)) {
                this.setActiveClass(parseInt(e.key) - 1);
            }
        });
        d3.selectAll(".paint-btn").on("click", (e) => {
            const btn = e.currentTarget; // use currentTarget to get button even if svg clicked
            this.setActiveClass(parseInt(btn.dataset.class));
        });

        // Accordion
        d3.selectAll(".accordion-header").on("click", (e) => {
            e.currentTarget.closest(".accordion").classList.toggle("collapsed");
        });

        // 3. Regression Settings
        d3.selectAll("#regression-panel .tab-btn").on("click", (e) => {
            this.config.regression.model = e.target.dataset.model;
            this.updateActiveTab("#regression-panel", e.target);
            this.els.lambdaRegControl.classed("active", this.config.regression.model === 'ridge');
            this.update();
        });
        d3.select("#lambda-input-reg").on("input", (e) => {
            this.config.regression.lambda = +e.target.value;
            d3.select("#lambda-val-reg").text(this.config.regression.lambda);
            this.update();
        });

        // 4. Classification Settings
        d3.selectAll("#classification-panel .tab-btn").on("click", (e) => {
            const model = e.target.dataset.model;
            this.config.classification.model = model;
            this.updateActiveTab("#classification-panel", e.target);
            
            this.els.polyControl.classed("active", model === 'logistic');
            this.els.logLambdaControl.classed("active", model === 'logistic');
            this.els.knnControl.classed("active", model === 'knn');
            this.update();
        });

        d3.select("#logistic-lambda-input").on("input", (e) => { this.config.classification.lambda = +e.target.value; d3.select("#logistic-lambda-val").text(this.config.classification.lambda.toFixed(1)); this.update(); });

        d3.select("#poly-degree-switcher").selectAll(".tab-btn").on("click", (e) => {
            const btn = e.currentTarget;
            const value = +btn.dataset.value;
            this.config.classification.polyDegree = value;
            
            d3.select("#poly-degree-switcher").selectAll(".tab-btn").classed("active", false);
            d3.select(btn).classed("active", true);
            this.updateTabSlider(document.querySelector("#poly-degree-switcher"));
            this.update();
        });

        d3.select("#knn-k-switcher").selectAll(".tab-btn").on("click", (e) => {
            const value = +e.currentTarget.dataset.value;
            this.config.classification.k = value;
            d3.select("#knn-k-switcher").selectAll(".tab-btn").classed("active", false);
            d3.select(e.currentTarget).classed("active", true);
            this.updateTabSlider(document.querySelector("#knn-k-switcher"));
            this.update();
        });

        // KMeans Settings
        d3.select("#kmeans-rerun").on("click", () => {
            this.kmeansCentroids = null;
            this.update();
        });
        
        // Axis Settings
        const linkInput = (id, key, isText = false) => {
            d3.select(id).on("input", (e) => {
                this.config[key] = isText ? e.target.value : +e.target.value;
                this.update();
            });
        };
        linkInput("#reg-x-name", "regAxisX", true);
        linkInput("#reg-y-name", "regAxisY", true);
        linkInput("#reg-xmin", "xMin");
        linkInput("#reg-xmax", "xMax");
        linkInput("#reg-ymin", "yMin");
        linkInput("#reg-ymax", "yMax");
        linkInput("#cls-x-name", "clsAxisX", true);
        linkInput("#cls-y-name", "clsAxisY", true);
        linkInput("#cls-xmin", "xMin");
        linkInput("#cls-xmax", "xMax");
        linkInput("#cls-ymin", "yMin");
        linkInput("#cls-ymax", "yMax");
        // PCA
        linkInput("#pca-x-name", "pcaAxisX", true);
        linkInput("#pca-y-name", "pcaAxisY", true);
        linkInput("#pca-xmin", "xMin");
        linkInput("#pca-xmax", "xMax");
        linkInput("#pca-ymin", "yMin");
        linkInput("#pca-ymax", "yMax");
        // KMeans
        linkInput("#kmeans-x-name", "kmeansAxisX", true);
        linkInput("#kmeans-y-name", "kmeansAxisY", true);
        linkInput("#kmeans-xmin", "xMin");
        linkInput("#kmeans-xmax", "xMax");
        linkInput("#kmeans-ymin", "yMin");
        linkInput("#kmeans-ymax", "yMax");

        // Click-to-edit Class Names
        d3.selectAll('.click-to-edit').on('click', (e) => {
            const label = e.currentTarget;
            const parent = label.parentNode;
            const currentText = label.textContent;
            const classIndex = label.id.match(/cls-(\d)-name-label/)[1];
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;

            const save = () => {
                const newText = input.value.trim();
                if (newText) {
                    this.config[`cls${classIndex}Name`] = newText;
                }
                parent.replaceChild(label, input);
                this.update();
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    save();
                } else if (e.key === 'Escape') {
                    parent.replaceChild(label, input);
                }
            });

            parent.replaceChild(input, label);
            input.focus();
            input.select();
        });

        d3.selectAll("[data-tooltip]").on("mouseover", (event) => this.showGlobalTooltip(event))
            .on("mouseout", () => this.hideGlobalTooltip());

        this.els.metricCard.on("mouseover", (event) => this.showGlobalTooltip(event))
            .on("mouseout", () => this.hideGlobalTooltip());
    }

    showGlobalTooltip(event) {
        const target = event.currentTarget;
        const tooltipText = target.dataset.tooltip;
        if (!tooltipText) return;

        // Set content and make it measurable but invisible
        this.globalTooltip
            .html(tooltipText)
            .style("opacity", 0)
            .classed("hidden", false);

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this.globalTooltip.node().getBoundingClientRect();

        let top = targetRect.top - tooltipRect.height - 8; // Position above
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2); // Center

        // Boundary checks
        if (top < 8) {
            top = targetRect.bottom + 8; // Flip below
        }
        if (left < 8) {
            left = 8;
        }
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        // Position it, then fade it in
        this.globalTooltip
            .style("top", `${top}px`)
            .style("left", `${left}px`)
            .style("opacity", 1);
    }

    hideGlobalTooltip() {
        this.globalTooltip.style("opacity", 0);
    }


    // --- Actions ---

    setMode(newMode) {
        if (this.mode === newMode) return;
        
        // UI Animation
        const activeBtn = document.querySelector(`.seg-btn[data-mode="${newMode}"]`);
        if (activeBtn) {
            d3.selectAll(".seg-btn").classed("active", false);
            d3.select(activeBtn).classed("active", true);
            requestAnimationFrame(() => {
                this.els.slider.style("width", `${activeBtn.offsetWidth}px`);
                this.els.slider.style("transform", `translateX(${activeBtn.offsetLeft - 4}px)`);
            });
        }

        // Logic
        const oldMode = this.mode;
        this.mode = newMode;

        // Keep data, but transform if needed
        if (oldMode === 'regression' && newMode === 'classification') {
            this.data.forEach(d => d.class = 0); // Set all points to class 0 (blue)
            this.setActiveClass(0); // Set painter to class 0
        }
        // For classification -> regression, we just ignore the .class property.

        // Clear old visualizations
        this.errorLinesG.selectAll("*" ).remove();
        this.errorSquaresG.selectAll("*" ).remove();
        this.pointsG.selectAll("*").remove();
        
        // Panel Switch
        this.els.regPanel.classed("hidden", newMode !== 'regression');
        this.els.clsPanel.classed("hidden", newMode !== 'classification');
        this.els.pcaPanel.classed("hidden", newMode !== 'pca');
        this.els.kmeansPanel.classed("hidden", newMode !== 'kmeans');

        // Update Metric Label
        if (newMode === 'pca') {
            this.els.metricLabel.html('PC1 / PC2');
        } else if (newMode === 'kmeans') {
            this.els.metricLabel.text("Inertia");
        } else {
            this.els.metricLabel.text(newMode === 'regression' ? "R²" : "Accuracy");
        }

        this.updateMetricTooltip();

        this.resetForMode(newMode);
        this.update();
    }

    setActiveClass(clsIdx) {
        this.config.classification.activeClass = clsIdx;
        d3.selectAll(".paint-btn").classed("active", false);
        d3.select(`.paint-btn[data-class="${clsIdx}"]`).classed("active", true);
    }

    updateMetricTooltip() {
        if (this.mode === 'regression') {
            this.els.metricCard.attr(
                "data-tooltip",
                "R²（決定係數）：衡量模型解釋資料變異的比例。1 表示完美擬合，0 表示與平均值預測一樣，負值代表比平均更差。"
            );
        } else if (this.mode === 'classification') {
            this.els.metricCard.attr(
                "data-tooltip",
                "Accuracy：正確分類的比例 = 正確筆數 / 總筆數。"
            );
        } else if (this.mode === 'pca') {
            this.els.metricCard.attr(
                "data-tooltip",
                "PC1 / PC2 解釋變異比例：數值代表該主成分保留的資料變異量百分比。"
            );
        } else {
            this.els.metricCard.attr(
                "data-tooltip",
                "Inertia（群內平方距離總和）：所有點到所屬中心的平方距離總和，越小代表群內更緊密，會隨 K 增加而下降。"
            );
        }
    }

    updateActiveTab(panelId, target) {
        d3.selectAll(`${panelId} .tab-btn`).classed("active", false);
        d3.select(target).classed("active", true);
        const switcher = target.closest(".tab-switcher");
        this.updateTabSlider(switcher);
    }

    resetData() {
        this.data = [];
        if (this.mode === 'kmeans') {
            this.kmeansCentroids = null;
        }
        this.update();
    }

    handleCanvasClick(e) {
        const [mx, my] = d3.pointer(e);
        // Check bounds
        if (mx < this.config.margin.left || mx > this.width - this.config.margin.right || 
            my < this.config.margin.top || my > this.height - this.config.margin.bottom) return;

        const x = this.xScale.invert(mx);
        const y = this.yScale.invert(my);

        if (this.mode === 'regression') {
            this.data.push({x, y});
        } else if (this.mode === 'classification') {
            this.data.push({x, y, class: this.config.classification.activeClass});
        } else {
            this.data.push({x, y});
        }
        this.update();
    }

    // --- Rendering ---

    update() {
        // 1. Update Scales
        this.xScale.domain([this.config.xMin, this.config.xMax]);
        this.yScale.domain([this.config.yMin, this.config.yMax]);

        // 2. Draw Axes & Grid
        this.xAxisG.call(d3.axisBottom(this.xScale).ticks(10).tickSize(0).tickPadding(10));
        this.yAxisG.call(d3.axisLeft(this.yScale).ticks(10).tickSize(0).tickPadding(10));
        
        // Custom Grid Lines
        this.gridG.selectAll("*" ).remove();
        const makeGrid = (scale, isX) => {
            const ticks = scale.ticks(10);
            ticks.forEach(t => {
                this.gridG.append("line").attr("class", "grid-line")
                    .attr("x1", isX ? scale(t) : this.config.margin.left)
                    .attr("y1", isX ? this.config.margin.top : scale(t))
                    .attr("x2", isX ? scale(t) : this.width - this.config.margin.right)
                    .attr("y2", isX ? this.height - this.config.margin.bottom : scale(t));
            });
        };
        makeGrid(this.xScale, true);
        makeGrid(this.yScale, false);
        d3.selectAll(".domain").remove(); // Remove ugly black axis line

        // Update Axis Labels
        if (this.mode === 'regression') {
            this.xLabel.text(this.config.regAxisX);
            this.yLabel.text(this.config.regAxisY);
        } else if (this.mode === 'classification') {
            this.xLabel.text(this.config.clsAxisX);
            this.yLabel.text(this.config.clsAxisY);
        } else if (this.mode === 'pca') {
            this.xLabel.text(this.config.pcaAxisX);
            this.yLabel.text(this.config.pcaAxisY);
        } else { // KMeans
            this.xLabel.text(this.config.kmeansAxisX);
            this.yLabel.text(this.config.kmeansAxisY);
        }

        // Update dynamic tooltips & labels
        if (this.mode === 'classification') {
            d3.select('.paint-btn[data-class="0"]').attr('data-tooltip', `${this.config.cls0Name} (Key 1)`);
            d3.select('.paint-btn[data-class="1"]').attr('data-tooltip', `${this.config.cls1Name} (Key 2)`);
            d3.select('#cls-0-name-label').text(this.config.cls0Name);
            d3.select('#cls-1-name-label').text(this.config.cls1Name);
        }

        // 3. Clear Canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Show/Hide Empty State Prompt
        this.els.emptyPrompt.style("display", this.data.length === 0 ? "flex" : "none");

        // 4. Logic & Specific Rendering
        if (this.mode === 'regression') {
            this.renderRegression();
        } else if (this.mode === 'classification') {
            this.renderClassification();
        } else if (this.mode === 'pca') {
            this.renderPCA();
        } else {
            this.renderKMeans();
        }

        if (this.mode === 'kmeans') {
            this.renderElbow();
        }
    }
    

    renderRegression() {
        this.linePath.style("display", "block");
        this.errorLinesG.selectAll("*" ).remove();
        this.errorSquaresG.selectAll("*" ).remove();
        this.pcAxesG.selectAll("*").remove();
        this.pcaProjectionG.selectAll("*").remove();
        this.kmeansCentroidsG.selectAll("*").remove();
        this.pointsG.selectAll("*").remove();
        
        // Train
        this.regEngine.train(this.data, this.config.regression.model, this.config.regression.lambda);
        
        // Metrics
        const r2 = this.regEngine.calcR2(this.data);
        this.els.metricVal.text(r2.toFixed(3));
        this.els.metricVal.style('color', r2 > 0.9 ? 'var(--class-c-green)' : r2 < 0.5 ? 'var(--class-b-orange)' : 'var(--primary-blue)');

        // Draw Line
        const {m, b} = this.regEngine.weights;
        const lineData = [
            {x: this.config.xMin, y: m * this.config.xMin + b},
            {x: this.config.xMax, y: m * this.config.xMax + b}
        ];
        const lineGen = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));
        this.linePath.attr("d", lineGen(lineData));

        // Draw Error Visualization
        if (this.data.length > 0) {
            if (this.config.regression.model === 'ols') {
                // For OLS, draw error squares
                this.errorSquaresG.selectAll(".error-square")
                    .data(this.data)
                    .enter()
                    .append("rect")
                    .attr("class", "error-square")
                    .each((d, i, nodes) => {
                        const y_hat = this.regEngine.predict(d.x);
                        const slope = this.regEngine.weights.m;

                        const side = Math.abs(this.yScale(d.y) - this.yScale(y_hat));
                        const y_pos = this.yScale(Math.max(d.y, y_hat));

                        const pointIsAbove = d.y > y_hat;
                        const slopeIsPositive = slope >= 0;

                        let x_pos;
                        if (pointIsAbove === slopeIsPositive) {
                            // If (point above AND slope positive) OR (point below AND slope negative), draw left.
                            x_pos = this.xScale(d.x) - side;
                        } else {
                            // Otherwise, draw right.
                            x_pos = this.xScale(d.x);
                        }
                        
                        d3.select(nodes[i])
                            .attr("x", x_pos)
                            .attr("y", y_pos)
                            .attr("width", side)
                            .attr("height", side);
                    });
            } else {
                // For LAD/Ridge, draw error lines
                this.errorLinesG.selectAll(".error-line")
                    .data(this.data)
                    .enter()
                    .append("line")
                    .attr("class", "error-line")
                    .attr("x1", d => this.xScale(d.x))
                    .attr("y1", d => this.yScale(d.y))
                    .attr("x2", d => this.xScale(d.x))
                    .attr("y2", d => this.yScale(this.regEngine.predict(d.x)));
            }
        }

        // Draw Points
        const points = this.pointsG.selectAll(".dot").data(this.data);
        points.exit().remove();
        points.enter().append("circle")
            .attr("class", "dot dot-regression")
            .attr("r", 6)
            .merge(points)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .on("mouseover", (e, d) => {
                const y_hat = this.regEngine.predict(d.x);
                const error = Math.abs(d.y - y_hat);
                const content = `${this.config.regAxisX}: ${d.x.toFixed(1)}
${this.config.regAxisY}: ${d.y.toFixed(1)}
Error: ${error.toFixed(2)}`;
                this.showTooltip(e, d, content);
            })
            .on("mouseout", () => this.hideTooltip());
    }

    renderClassification() {
        this.linePath.style("display", "none");
        this.pcAxesG.selectAll("*").remove();
        this.pcaProjectionG.selectAll("*").remove();
        this.kmeansCentroidsG.selectAll("*").remove();

        // Train
        if (this.data.length > 0) {
            this.clsEngine.train(this.data, this.config.classification);
            
            // Draw Decision Boundary (Background)
            // Pixel-based rendering on Canvas (step = 4px for performance)
            const step = 4;
            const w = this.width - this.config.margin.right;
            const h = this.height - this.config.margin.bottom;
            
            for (let px = this.config.margin.left; px < w; px += step) {
                for (let py = this.config.margin.top; py < h; py += step) {
                    const xVal = this.xScale.invert(px);
                    const yVal = this.yScale.invert(py);
                    const probs = this.clsEngine.predictProbabilities(xVal, yVal, this.config.classification);
                    
                    // Color Blending
                    const r = Math.round(59 * probs[0] + 249 * probs[1]);
                    const g = Math.round(130 * probs[0] + 115 * probs[1]);
                    const b = Math.round(246 * probs[0] + 22 * probs[1]);
                    
                    // Higher confidence -> higher alpha
                    const confidence = Math.abs(probs[1] - 0.5) * 2;
                    const alpha = confidence * 0.35;
                    
                    this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                    this.ctx.fillRect(px, py, step, step);
                }
            }

            // Accuracy Metric
            let correct = 0;
            this.data.forEach(d => {
                if (this.clsEngine.predictClass(d.x, d.y, this.config.classification) === d.class) correct++;
            });
            const accuracy = this.data.length > 0 ? correct / this.data.length : 0;
            this.els.metricVal.text(accuracy.toFixed(2));
            this.els.metricVal.style('color', accuracy > 0.9 ? 'var(--class-c-green)' : accuracy < 0.5 ? 'var(--class-b-orange)' : 'var(--primary-blue)');

        } else {
            this.els.metricVal.text("0.00").style('color', 'var(--primary-blue)');
        }

        // Draw Points (Shapes)
        this.pointsG.selectAll("*" ).remove(); // Re-draw all for easier shape handling
        
        this.data.forEach(d => {
            const cx = this.xScale(d.x);
            const cy = this.yScale(d.y);
            let shape;
            const cls = d.class === 1 ? 1 : 0;
            if (cls === 0) {
                shape = this.pointsG.append("circle").attr("r", 6).attr("cx", cx).attr("cy", cy);
            } else {
                shape = this.pointsG.append("rect").attr("width", 12).attr("height", 12).attr("x", cx-6).attr("y", cy-6).attr("rx", 2);
            }
            
            shape.attr("class", `shape-class-${cls}`)
                .on("mouseover", (e) => {
                    const probs = this.clsEngine.predictProbabilities(d.x, d.y, this.config.classification);
                    const class1Name = (this.config.cls1Name || 'Class 1').trim() || 'Class 1';
                    const content = `${this.config.clsAxisX}: ${d.x.toFixed(1)}\n${this.config.clsAxisY}: ${d.y.toFixed(1)}\nP(Y=${class1Name}): ${probs[1].toFixed(2)}`;
                    this.showTooltip(e, d, content);
                })
                .on("mouseout", () => this.hideTooltip());
        });
    }

    renderPCA() {
        // 1. Clear any visuals from other modes
        this.linePath.style("display", "none");
        this.errorLinesG.selectAll("*").remove();
        this.errorSquaresG.selectAll("*").remove();
        this.pcAxesG.selectAll("*").remove();
        this.pcaProjectionG.selectAll("*").remove();
        this.kmeansCentroidsG.selectAll("*").remove();
        this.pointsG.selectAll("*").remove();

        if (this.data.length < 2) {
            this.els.metricVal.html(''); // Clear metrics if not enough data
            return;
        }

        // 2. Train PCA Engine
        this.pcaEngine.train(this.data);
        const transformedData = this.pcaEngine.getTransformedData();
        const explainedVariance = this.pcaEngine.getExplainedVariance();
        const eigenvalues = this.pcaEngine.getEigenvalues();
        const mean = this.pcaEngine.mean;
        const W = this.pcaEngine.W;

        // 3. Update Metrics
        this.els.metricVal.html(`
            <span style="font-size: 1.1rem;">${(explainedVariance[0] * 100).toFixed(1)}%</span>
            <span style="font-size: 1.1rem;">${(explainedVariance[1] * 100).toFixed(1)}%</span>
        `).style('color', 'var(--text-primary)');


        // 4. Draw PCA axes in original space
        const xRange = this.config.xMax - this.config.xMin;
        const yRange = this.config.yMax - this.config.yMin;
        const maxLen = 0.45 * Math.min(xRange, yRange);
        const minLen = 0.18 * Math.min(xRange, yRange);
        const len1 = Math.min(maxLen, Math.max(minLen, Math.sqrt(eigenvalues[0]) * 2));
        const len2 = Math.min(maxLen, Math.max(minLen, Math.sqrt(eigenvalues[1]) * 2));

        const pc1 = { x: mean[0] + W[0][0] * len1, y: mean[1] + W[1][0] * len1 };
        const pc2 = { x: mean[0] + W[0][1] * len2, y: mean[1] + W[1][1] * len2 };
        const origin = { x: mean[0], y: mean[1] };

        this.pcAxesG.append("line")
            .attr("class", "pca-axis-line pc1")
            .attr("x1", this.xScale(origin.x))
            .attr("y1", this.yScale(origin.y))
            .attr("x2", this.xScale(pc1.x))
            .attr("y2", this.yScale(pc1.y))
            .attr("marker-end", "url(#pc1-arrow)");

        this.pcAxesG.append("line")
            .attr("class", "pca-axis-line pc2")
            .attr("x1", this.xScale(origin.x))
            .attr("y1", this.yScale(origin.y))
            .attr("x2", this.xScale(pc2.x))
            .attr("y2", this.yScale(pc2.y))
            .attr("marker-end", "url(#pc2-arrow)");

        const labelOffset = 10;
        this.pcAxesG.append("text")
            .attr("class", "pca-axis-label pc1")
            .attr("x", this.xScale(pc1.x) + labelOffset)
            .attr("y", this.yScale(pc1.y) - labelOffset)
            .text("PC1");

        this.pcAxesG.append("text")
            .attr("class", "pca-axis-label pc2")
            .attr("x", this.xScale(pc2.x) + labelOffset)
            .attr("y", this.yScale(pc2.y) - labelOffset)
            .text("PC2");

        // 5. Draw PC1 projection bars
        const projExtent = d3.extent(transformedData, d => d.x);
        const projPadding = (projExtent[1] - projExtent[0]) * 0.08 || 1;
        const projScale = d3.scaleLinear()
            .domain([projExtent[0] - projPadding, projExtent[1] + projPadding])
            .range([this.config.margin.left, this.width - this.config.margin.right]);

        const projBase = this.height - 10;
        const projTop = this.height - this.config.margin.bottom + 8;
        const projHeight = Math.max(10, projBase - projTop);
        const barWidth = 6;

        this.pcaProjectionG.append("line")
            .attr("class", "pca-projection-base")
            .attr("x1", this.config.margin.left)
            .attr("x2", this.width - this.config.margin.right)
            .attr("y1", projBase)
            .attr("y2", projBase);

        this.pcaProjectionG.selectAll(".pca-projection-bar")
            .data(transformedData)
            .enter()
            .append("rect")
            .attr("class", "pca-projection-bar")
            .attr("x", d => projScale(d.x) - barWidth / 2)
            .attr("y", projBase - projHeight)
            .attr("width", barWidth)
            .attr("height", projHeight);

        // 6. Draw points in original space
        const points = this.pointsG.selectAll(".dot").data(this.data);
        points.exit().remove();
        points.enter().append("circle")
            .attr("class", "dot dot-regression") // Use same style as regression (blue)
            .attr("r", 6)
            .merge(points)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .on("mouseover", (e, d) => {
                const content = `x: ${d.x.toFixed(2)}\ny: ${d.y.toFixed(2)}`;
                this.showTooltip(e, d, content);
            })
            .on("mouseout", () => this.hideTooltip());
    }

    renderKMeans() {
        this.linePath.style("display", "none");
        this.errorLinesG.selectAll("*").remove();
        this.errorSquaresG.selectAll("*").remove();
        this.pcAxesG.selectAll("*").remove();
        this.pcaProjectionG.selectAll("*").remove();
        this.pointsG.selectAll("*").remove();
        this.kmeansCentroidsG.selectAll("*").remove();

        if (this.data.length === 0) {
            this.els.metricVal.text("0.00").style('color', 'var(--primary-blue)');
            return;
        }

        this.kmeansEngine.train(this.data, this.config.kmeans.k, this.kmeansCentroids);
        const centroids = this.kmeansEngine.getCentroids();
        const assignments = this.kmeansEngine.getAssignments();
        this.kmeansCentroids = centroids;

        const palette = ['#3B82F6', '#F97316', '#10B981', '#EF4444', '#A855F7', '#14B8A6', '#F59E0B', '#6366F1'];
        const toRgb = (hex) => {
            const h = hex.replace('#', '');
            const n = parseInt(h, 16);
            return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        };
        const paletteRgb = palette.map(toRgb);

        if (centroids.length > 0) {
            const step = 4;
            const w = this.width - this.config.margin.right;
            const h = this.height - this.config.margin.bottom;
            for (let px = this.config.margin.left; px < w; px += step) {
                for (let py = this.config.margin.top; py < h; py += step) {
                    const xVal = this.xScale.invert(px);
                    const yVal = this.yScale.invert(py);
                    let bestIdx = 0;
                    let bestDist = Infinity;
                    for (let i = 0; i < centroids.length; i++) {
                        const dx = xVal - centroids[i].x;
                        const dy = yVal - centroids[i].y;
                        const dist = dx * dx + dy * dy;
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestIdx = i;
                        }
                    }
                    const color = paletteRgb[bestIdx % paletteRgb.length];
                    this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.18)`;
                    this.ctx.fillRect(px, py, step, step);
                }
            }
        }

        const inertia = this.kmeansEngine.getInertia();
        this.els.metricVal.text(inertia.toFixed(2)).style('color', 'var(--text-primary)');

        const points = this.pointsG.selectAll(".dot").data(this.data);
        points.exit().remove();
        points.enter().append("circle")
            .attr("class", "dot kmeans-dot")
            .attr("r", 6)
            .merge(points)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .attr("fill", (d, i) => {
                const idx = assignments[i] || 0;
                return palette[idx % palette.length];
            })
            .on("mouseover", (e, d, i) => {
                const idx = assignments[this.data.indexOf(d)] || 0;
                const c = centroids[idx];
                const dist = c ? Math.hypot(d.x - c.x, d.y - c.y) : 0;
                const content = `${this.config.kmeansAxisX}: ${d.x.toFixed(1)}\n${this.config.kmeansAxisY}: ${d.y.toFixed(1)}\nCluster: ${idx + 1}\nDist: ${dist.toFixed(2)}`;
                this.showTooltip(e, d, content);
            })
            .on("mouseout", () => this.hideTooltip());

        const centroidNodes = this.kmeansCentroidsG.selectAll(".kmeans-centroid").data(centroids);
        centroidNodes.exit().remove();
        centroidNodes.enter().append("circle")
            .attr("class", "kmeans-centroid")
            .attr("r", 10)
            .merge(centroidNodes)
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .attr("stroke", (d, i) => palette[i % palette.length]);
    }

    renderElbow() {
        if (!this.elbowSvg || this.els.elbowContainer.empty()) return;

        const width = this.els.elbowContainer.node().clientWidth || 240;
        const height = this.els.elbowContainer.node().clientHeight || 140;
        const pad = { top: 8, right: 22, bottom: 22, left: 32 };
        const viewW = width + pad.right;

        this.elbowSvg
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${viewW} ${height}`);
        this.elbowSvg.selectAll("*").remove();

        if (this.data.length === 0) return;

        const maxK = Math.min(this.kmeansElbowMax, this.data.length);
        const elbow = [];
        for (let k = 1; k <= maxK; k++) {
            const engine = new KMeansEngine();
            engine.train(this.data, k, null);
            elbow.push({ k, inertia: engine.getInertia() });
        }
        this.elbowData = elbow;

        const x = d3.scaleLinear().domain([1, maxK]).range([pad.left, width - pad.right]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(elbow, d => d.inertia) || 1])
            .nice()
            .range([height - pad.bottom, pad.top]);

        const line = d3.line()
            .x(d => x(d.k))
            .y(d => y(d.inertia));

        this.elbowSvg.append("g")
            .attr("class", "elbow-axis")
            .attr("transform", `translate(0,${height - pad.bottom})`)
            .call(d3.axisBottom(x).ticks(maxK).tickFormat(d3.format("d")));

        this.elbowSvg.append("g")
            .attr("class", "elbow-axis")
            .attr("transform", `translate(${pad.left},0)`)
            .call(d3.axisLeft(y).ticks(3));

        this.elbowSvg.append("path")
            .attr("class", "elbow-line")
            .attr("d", line(elbow));

        const currentK = Math.min(this.config.kmeans.k, maxK);
        this.elbowSvg.selectAll(".elbow-point")
            .data(elbow)
            .enter()
            .append("circle")
            .attr("class", d => d.k === currentK ? "elbow-point active" : "elbow-point")
            .attr("r", d => d.k === currentK ? 5 : 4)
            .attr("cx", d => x(d.k))
            .attr("cy", d => y(d.inertia))
            .on("click", (e, d) => {
                this.config.kmeans.k = d.k;
                this.kmeansCentroids = null;
                this.update();
            });
    }

    showTooltip(e, d, content) {
        // 1. Set content and make it measurable but invisible at a temporary location
        this.pointTooltip
            .style("opacity", 0)
            .text(content)
            .classed("hidden", false)
            .style("left", "-1000px") // Move off-screen to prevent flicker
            .style("top", "-1000px");

        // 2. Measure the tooltip's actual dimensions
        const tooltipRect = this.pointTooltip.node().getBoundingClientRect();
        if (tooltipRect.width === 0) return; // Bail if measurement failed

        // 3. Get the data point's screen coordinates (relative to the #viz container)
        const cx = this.xScale(d.x);
        const cy = this.yScale(d.y);

        const xDomain = this.xScale.domain();
        const xMidpoint = (xDomain[0] + xDomain[1]) / 2;

        // 4. Calculate final position
        let left;
        if (d.x > xMidpoint) {
            // Point is on the right half, show tooltip to the LEFT of the point
            left = cx - tooltipRect.width - 15;
        } else {
            // Point is on the left half, show tooltip to the RIGHT of the point
            left = cx + 15;
        }

        // Position vertically centered with the point
        let top = cy - tooltipRect.height / 2;

        // --- Boundary clamp to keep tooltip within the viz canvas ---
        if (top < 8) top = 8;
        if (left < 8) left = 8;
        if (top + tooltipRect.height > this.height - 8) top = this.height - tooltipRect.height - 8;
        if (left + tooltipRect.width > this.width - 8) left = this.width - tooltipRect.width - 8;

        // 5. Set final position and fade in
        this.pointTooltip
            .style("left", `${left}px`)
            .style("top", `${top}px`)
            .style("opacity", 1);
    }

    hideTooltip() {
        this.pointTooltip.style("opacity", 0).classed("hidden", true);
    }
}
