# GitHub Pages Deployment Setup

## Issue
The page appears blank because GitHub Pages has not been enabled in the repository settings.

## Root Cause
The GitHub Actions workflow "Deploy to GitHub Pages" is configured correctly and runs successfully for the build step, but fails during deployment with a 404 error:

```
Error: Failed to create deployment (status: 404)
Ensure GitHub Pages has been enabled: https://github.com/ronnymn/standalone-charts-cart/settings/pages
```

## Solution

### Step 1: Enable GitHub Pages

1. Go to the repository **Settings** page:
   https://github.com/ronnymn/standalone-charts-cart/settings/pages

2. Under the **"Build and deployment"** section:
   - **Source**: Select **"GitHub Actions"** from the dropdown
   - (The branch and folder options will be greyed out since GitHub Actions will handle the deployment)

3. Click **Save** if there's a save button

### Step 2: Verify Deployment

Once GitHub Pages is enabled:

1. Push a commit to the `main` branch (or re-run the workflow)
2. Monitor the workflow at: https://github.com/ronnymn/standalone-charts-cart/actions
3. The "Deploy to GitHub Pages" workflow should complete successfully
4. The site will be available at: https://ronnymn.github.io/standalone-charts-cart/

### Step 3: Verify the Site

Visit https://ronnymn.github.io/standalone-charts-cart/ and confirm that:
- The page loads (not blank)
- The Highcharts License Calculator interface is visible
- Product cards (Core, Stock, Maps, Gantt) are displayed
- Clicking products updates the total price

## Technical Details

### Build Configuration
- The project uses Vite with React
- Base path is correctly set to `/standalone-charts-cart/` in `vite.config.ts`
- Build outputs to the `dist` folder
- The workflow uploads `dist` contents as the GitHub Pages artifact

### Workflow Configuration
The `.github/workflows/deploy.yml` file:
- Builds the project with `npm run build`
- Creates a `.nojekyll` file in `dist` to bypass Jekyll processing
- Uploads the `dist` folder as an artifact
- Deploys the artifact to GitHub Pages (requires Pages to be enabled)

## Troubleshooting

If the site is still blank after enabling GitHub Pages:

1. **Check the workflow logs**: 
   - Go to https://github.com/ronnymn/standalone-charts-cart/actions
   - Check if both the "build" and "deploy" jobs succeeded

2. **Verify the URL**:
   - Make sure you're visiting: https://ronnymn.github.io/standalone-charts-cart/
   - Note the trailing slash - some browsers may require it

3. **Check browser console**:
   - Open browser developer tools (F12)
   - Look for JavaScript errors in the Console tab
   - Check the Network tab for failed resource requests

4. **Clear cache**:
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Try in an incognito/private window

## Local Development

To test locally:

```bash
# Development server
npm install
npm run dev
# Visit http://localhost:5173/standalone-charts-cart/

# Production build preview
npm run build
npm run preview
# Visit http://localhost:4173/standalone-charts-cart/
```
