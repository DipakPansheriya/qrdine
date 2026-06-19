# Firebase Hosting CI/CD Deployment Documentation

This document describes how to configure automatic production deployments to the Firebase Hosting site `orderbyqr` under project `qrdine-efd5f` using GitHub Actions and a Firebase CI token.

---

## 1. Generate Firebase Authentication Token

To allow GitHub Actions to deploy to Firebase Hosting on your behalf, you can generate a CI authentication token:

1. Open your terminal locally and run:
   ```bash
   npx firebase-tools login:ci
   ```
2. A browser tab will open automatically asking you to sign in with your Google account associated with your Firebase project.
3. Grant permissions. Once authenticated, return to your terminal.
4. The terminal will output a long token string (e.g., `1//09aA...`). Copy this token.

---

## 2. Add Credentials to GitHub Secrets

Add the copied token to your GitHub repository secrets:
1. Navigate to your GitHub repository in your web browser.
2. Go to the **Settings** tab.
3. On the left sidebar, click **Secrets and variables** > **Actions**.
4. Click **New repository secret** at the top right.
5. Enter the details:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the exact token printed in your terminal.
6. Click **Add secret** to save.

---

## 3. Verify the Deployment

Once your secret is configured:
1. Commit and push your changes to your repository's `main` branch:
   ```bash
   git add .
   git commit -m "chore: configure firebase deployment with token"
   git push origin main
   ```
2. Navigate to your GitHub repository page and click the **Actions** tab at the top.
3. The **Deploy to Firebase Hosting** workflow will run automatically:
   - It will install dependencies, build the production bundle (`npx ng build --configuration production`), and deploy it to Firebase.
4. Once completed successfully, the application will be live at:
   - URL: [https://orderbyqr.web.app](https://orderbyqr.web.app)
