# Google Apps Script Deployment Guide

Follow these steps to deploy the backend API for the **BHH NCD Profile** application.

## 1. Open Google Sheet & Apps Script
1. Open your created Google Sheet.
2. Select **Extensions** &gt; **Apps Script** from the top menu.
3. Rename the project to `bhh-ncd-backend`.

## 2. Paste Backend Code
1. Delete any boilerplate code inside the editor.
2. Open the file [apps-script/Code.gs](../apps-script/Code.gs) in this project.
3. Copy its entire content and paste it into the editor.
4. Save the file (Click the disk icon or press `Ctrl + S`).

## 3. Set Script Properties (Required)
Google Apps Script uses **Script Properties** to securely store environmental variables.
1. In the Apps Script sidebar, click the gear icon (**Project Settings**).
2. Scroll down to the **Script Properties** section.
3. Click **Add script property** and configure these two key-value pairs:
   - **Property**: `SHEET_ID`
     - **Value**: `PASTE_YOUR_SPREADSHEET_ID_HERE`
   - **Property**: `SETUP_KEY`
     - **Value**: `Admin123!` (or a custom secret key of your choice)
4. Click **Save script properties**.

## 4. Deploy as Web App
1. At the top right of the editor, click **Deploy** &gt; **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the settings exactly as follows:
   - **Description**: `bhh-ncd-api-v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. Grant permissions if prompted (Click **Authorize access**, log into your Google Account, click **Advanced** &gt; **Go to bhh-ncd-backend (unsafe)**, and click **Allow**).
6. Copy the **Web App URL** shown under the Web App section.
   - It will look like this: `https://script.google.com/macros/s/XXXXX/exec`

## 5. Run Database Installer
Before using the frontend, you must trigger the database installer to create the sheets:
- **Option A**: Open the frontend portal. The app will detect the missing URL, show the connection warning wizard, and give you a button to trigger setup.
- **Option B (Manual API)**: Send a POST request to your Web App URL with a JSON body:
  ```json
  {
    "action": "setup.install",
    "sheet_id": "YOUR_SPREADSHEET_ID",
    "setup_key": "Admin123!"
  }
  ```
  *(Note: Setup is non-destructive. Running it again will check and sync missing columns without altering existing data).*
