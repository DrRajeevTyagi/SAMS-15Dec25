# 🚀 GitHub Pages Setup - Step by Step

## Current GitHub Pages Setup Process

Since you're using GitHub Actions, the setup process is slightly different. Here's the correct way:

---

## Method 1: Automatic Detection (Recommended)

1. **Go to your repository Settings:**
   https://github.com/DrRajeevTyagi/SAMS-15Dec25/settings/pages

2. **Check the "Source" dropdown:**
   - If you see **"GitHub Actions"** as an option, select it
   - If you see **"Deploy from a branch"**, select that first, then:
     - Choose branch: `main` or `gh-pages`
     - Folder: `/ (root)` or `/dist`
     - Click **"Save"** (this should enable the button)

3. **If "GitHub Actions" appears:**
   - Select it from the dropdown
   - The page should automatically save (no button needed)
   - Or if there's a button, it might say "Save" or just be automatic

---

## Method 2: Let GitHub Actions Run First

Sometimes GitHub Pages needs the workflow to run once before it recognizes GitHub Actions:

1. **Go to Actions tab:**
   https://github.com/DrRajeevTyagi/SAMS-15Dec25/actions

2. **Manually trigger the workflow:**
   - Click on "Deploy to GitHub Pages" workflow
   - Click "Run workflow" button (if available)
   - Or wait for it to run automatically on next push

3. **After workflow completes:**
   - Go back to Settings → Pages
   - Now "GitHub Actions" should be available

---

## Method 3: Enable via Branch First

1. **Go to Settings → Pages**

2. **Select "Deploy from a branch"**

3. **Choose:**
   - Branch: `main`
   - Folder: `/ (root)`
   - Click **"Save"**

4. **Then change back:**
   - Change source to **"GitHub Actions"**
   - This should now work

---

## What You Should See

When GitHub Pages is properly configured:
- ✅ Source shows "GitHub Actions"
- ✅ A green checkmark or "Your site is live at..." message
- ✅ URL: `https://drrajeevtyagi.github.io/SAMS-15Dec25/`

---

## Important: Add API Key Secret First!

Before the workflow can build successfully:

1. **Go to:** https://github.com/DrRajeevTyagi/SAMS-15Dec25/settings/secrets/actions

2. **Click "New repository secret"**

3. **Add:**
   - Name: `VITE_API_KEY`
   - Value: Your Google Gemini API key
   - Click "Add secret"

---

## Troubleshooting

### If "Save" button is disabled:
- Make sure you've selected a source option first
- Try selecting "None" first, then your desired option
- Refresh the page

### If "GitHub Actions" option doesn't appear:
- The workflow needs to run at least once
- Go to Actions tab and trigger it manually
- Or make a small commit and push

### If workflow fails:
- Check Actions tab for error messages
- Make sure `VITE_API_KEY` secret is added
- Verify the workflow file is correct

---

## Quick Check

After setup, verify:
1. ✅ GitHub Pages source is set
2. ✅ `VITE_API_KEY` secret is added
3. ✅ Workflow runs successfully (check Actions tab)
4. ✅ Site is accessible at the GitHub Pages URL

---

**Need help?** Check the Actions tab for any error messages - they'll tell you exactly what's wrong!

