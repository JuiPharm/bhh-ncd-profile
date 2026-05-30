# GitHub Pages Deployment (No Actions)

This guide explains how to build, package, and deploy the **BHH NCD Profile** frontend to GitHub Pages without needing complex GitHub Actions or terminal deployment scripts.

---

## 1. Local Production Build
1. Open the project root in your terminal.
2. Run the build script:
   ```bash
   npm run build
   ```
3. Vite will compile the TypeScript application and output all static assets directly into the `/docs` folder at the root of the project.

---

## 2. Dynamic Runtime Config Configuration
1. Open the file [docs/config.js](../docs/config.js) in your text editor.
2. Replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your copied Google Apps Script Web App URL:
   ```javascript
   window.BHH_CONFIG = {
     GAS_WEB_APP_URL: "https://script.google.com/macros/s/YOUR_MACRO_ID/exec",
     APP_NAME: "BHH NCD Profile",
     APP_VERSION: "1.0.0"
   };
   ```
3. Save the file.
4. **Important**: Because the application loads `config.js` at runtime, you can change the sheet database API endpoint at any time simply by editing this file on GitHub or locally, with **no need to recompile the React project**.

---

## 3. Push to GitHub
1. Create a new GitHub repository (public or private).
2. Commit and push the entire project (including the `/docs` folder) to your repository's `main` branch.
   *(Make sure you do **not** commit actual patient records or spreadsheets to public repositories).*

---

## 4. Configure GitHub Pages
1. Go to your repository page on GitHub.
2. Navigate to **Settings** &gt; **Pages** (under the Code and Automation section).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch` from the dropdown.
   - **Branch**: Select `main`.
   - **Folder**: Select `/docs` from the folder dropdown.
4. Click **Save**.
5. Wait 1-2 minutes. GitHub will display a notification with your live site URL:
   `https://<your-username>.github.io/<your-repository-name>/`
6. Open the URL. The app is live!

---

## 5. Troubleshooting Blank Page
If you open the site and see a blank page:
- **Inspect Console**: Right-click and choose "Inspect" -> "Console".
- **Path Resolution**: The project uses `base: './'` in `vite.config.ts`, which makes all asset paths relative. If your assets fail to load, ensure the files in `docs/assets/` were fully committed and pushed.
- **Config check**: Ensure `config.js` is loading before the main JS bundle.
