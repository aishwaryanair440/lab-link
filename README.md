# LabLink - University Equipment Catalogue

LabLink is a modern, responsive Web Application designed to manage college and university laboratory equipment. Built with a professional Academic OPAC (Online Public Access Catalog) interface, it acts as a digital Circulation Desk for lab assistants and an equipment portal for students.

## 🚀 Features

*   **Role-Based Access Control:**
    *   **Student Portal:** Students can login using their Student ID (e.g., `ST001`) to view their currently issued equipment, transaction history, and browse the live equipment catalog.
    *   **Lab Assistant / Admin:** Staff can log in (using `admin`) to access the Circulation Desk, issue/return equipment, view damage logs, and manage all student transactions.
*   **Integrated Barcode Scanning:** Uses local device cameras (via `Html5-Qrcode`) to scan student IDs and equipment barcode labels directly from the browser for rapid checkout/check-in.
*   **Google Sheets Backend:** Completely serverless. The entire database is powered by Google Sheets and accessed via a secure Google Apps Script REST API.
*   **Smart Fallback Identifier:** The system intelligently normalizes scanned barcodes, primary Equipment IDs, and exact Equipment Names to seamlessly track equipment across multiple connected Google Sheets.
*   **Offline / Demo Mode:** Built-in mock data mode allows showcasing the UI and workflow without an active API connection.
*   **Modern UI/UX:** Styled with custom CSS variables, a responsive layout, toast notifications, loading skeletons, and interactive glassmorphism components.

## 🛠️ Technology Stack

*   **Front-end:** HTML5, CSS3, Vanilla JavaScript (ES6+), FontAwesome Icons.
*   **Barcode Library:** [html5-qrcode](https://github.com/mebjas/html5-qrcode)
*   **Back-end (API):** Google Apps Script (`.gs`)
*   **Database:** Google Sheets

## 📂 Project Structure

```
/lab-link
├── index.html               # Main Single-Page Application layout & login UI
├── styles.css               # Design system, OPAC themes, and responsive CSS
├── app.js                   # Client-side logic, routing, API calls, and scanner integration
└── LabEquipmentTracker.gs   # The backend Apps Script codebase
```

## ⚙️ Installation & Setup

### 1. Database Setup (Google Sheets & Apps Script)

1.  Open the `LabEquipmentTracker.gs` file in this repository.
2.  Copy all the code and paste it into a new [Google Apps Script](https://script.google.com/) project.
3.  Ensure the `SPREADSHEET_ID` and `BARCODE_SPREADSHEET_ID` variables at the top of the dataset retrieval section point to your target Google sheets.
4.  Run the `setupLabEquipmentSystem()` function once inside the Apps Script editor to auto-generate the sheet structure, populate mock data (if needed), and generate the printable student/equipment labels.
5.  **Deploy as Web App:**
    *   Click **Deploy > New deployment**.
    *   Select **Web app**.
    *   Execute as: **Me**.
    *   Who has access: **Anyone**.
    *   Copy the generated Web App URL.

### 2. Frontend Configuration

1.  Open `app.js`.
2.  Locate `APP_STATE.apiUrl` at the top of the file.
3.  Paste your newly deployed Google Apps Script Web App URL:
    ```javascript
    const APP_STATE = {
        apiUrl: "https://script.google.com/macros/s/YOUR_API_KEY/exec",
        // ...
    };
    ```

### 3. Running Locally

You can serve the application locally using any basic HTTP server. For example, using Node.js:

```bash
npx serve .
```

Then navigate to `http://localhost:3000` in your browser.

## 📖 Usage Guide

*   **Logging in as Admin:** Select the 'Staff Login' tab and enter `admin`. From here, navigate to **Issue Equipment** or **Return Equipment** to start scanning items.
*   **Logging in as Student:** Select the 'Student Login' tab and enter a valid Student ID (e.g., `ST001` or `ST008`). Browse the Catalogue or check personal borrowings.
*   **Offline Mode:** Click "Use Demo Mode (Offline)" on the login screen to test the interface without communicating with the Google Sheets database.

## ⚠️ Notes on Barcode Scanning

The system natively supports camera-based barcode scanning. Make sure the site is served over `https://` (or `localhost`) for the web browser to allow camera permissions. If an equipment barcode cannot be read, laboratory assistants can manually type the Equipment ID or Equipment Name.