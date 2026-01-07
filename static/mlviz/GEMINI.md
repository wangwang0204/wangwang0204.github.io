# Project Overview

This project is an interactive web-based machine learning dashboard. It allows users to visualize and interact with three different machine learning models: Regression, Classification, and Principal Component Analysis (PCA). The application is built using HTML, CSS, and JavaScript, with the D3.js library for data visualization.

The user can add data points by clicking on the canvas, and the selected model will update in real-time. The user can also adjust the model's parameters and see the effect on the visualization.

## Key Technologies

*   **Frontend:** HTML, CSS, JavaScript
*   **Data Visualization:** D3.js
*   **Machine Learning:** Custom implementations of:
    *   Linear Regression (Ordinary Least Squares, Least Absolute Deviations, Ridge)
    *   Logistic Regression (Multinomial with polynomial features)
    *   K-Nearest Neighbors (KNN)
    *   Principal Component Analysis (PCA) using the `pca-js` library.

# Building and Running

This is a static web project with no build process. To run the application, simply open the `index.html` file in a web browser.

It is recommended to use a local web server to avoid potential issues with browser security policies (e.g., CORS). You can use Python's built-in HTTP server for this:

```bash
python3 -m http.server
```

Then, open your web browser and navigate to `http://localhost:8000`.

# Development Conventions

*   **Code Style:** The code follows a consistent style, with classes for the main application and the machine learning engines.
*   **File Structure:** The code is organized into separate files for the main application logic (`app.js`), the machine learning engines (`engine.reg.js`, `engine.cls.js`, `engine.pca.js`), the HTML structure (`index.html`), and the styling (`style.css`).
*   **Dependencies:** The project uses D3.js, which is included via a CDN in `index.html`. The `pca.js` library is also included in `index.html` but is missing from the project directory.
*   **Testing:** There are no explicit tests in the project.
