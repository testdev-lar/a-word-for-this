# Deployment Guide: "A Word for This"

This guide will walk you through deploying your app to Netlify so anyone can use it with just a link!

## What You've Done So Far

Your app is now set up to be deployed securely. Here's what changed:

1. **Created a serverless function** (`netlify/functions/find-word.js`) - This runs on Netlify's servers and keeps your API key completely hidden
2. **Updated app.js** - Now calls the serverless function instead of OpenRouter directly
3. **Removed the API key from your code** - It's no longer visible in the browser
4. **Created configuration files** - netlify.toml, package.json, .gitignore

## Step-by-Step Deployment Instructions

### Step 1: Create a Netlify Account

1. Go to https://www.netlify.com/
2. Click "Sign up" in the top-right corner
3. Sign up with GitHub (recommended), GitLab, Bitbucket, or email
4. Follow the prompts to create your account

### Step 2: Open Git Bash

You already have Git Bash installed, so you can use it for all the commands!

1. Navigate to your project folder in File Explorer: `c:\Users\bayle\Desktop\WordForThisWeb`
2. Right-click anywhere in the folder
3. Select "Git Bash Here"
4. A terminal window will open - you're ready to go!

### Step 3: Initialize Your Project as a Git Repository

In the Git Bash window that's now open, run these commands one at a time:

```bash
git init
git add .
git commit -m "Initial commit - A Word for This web app"
```

**What this does:** Git tracks changes to your files so you can deploy them.

### Step 4: Create a GitHub Repository

1. Go to https://github.com and sign in (create account if needed)
2. Click the "+" icon in the top-right, select "New repository"
3. Repository name: `a-word-for-this`
4. Description: "Find the perfect word for any emotion"
5. Keep it **Public** or **Private** (either works)
6. **DO NOT** check "Initialize with README"
7. Click "Create repository"

### Step 5: Push Your Code to GitHub

GitHub will show you commands to run. In the same Git Bash window, run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/a-word-for-this.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

**What this does:** Uploads your code to GitHub so Netlify can deploy it.

### Step 6: Deploy to Netlify

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Click "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select your `a-word-for-this` repository
6. **Site settings:**
   - Build command: (leave blank)
   - Publish directory: `.` (just a period)
7. Click "Deploy site"

Netlify will assign you a random URL like `https://random-name-12345.netlify.app`

### Step 7: Add Your API Key as Environment Variable

**THIS IS THE MOST IMPORTANT STEP FOR SECURITY!**

1. In Netlify, go to your site dashboard
2. Click "Site configuration" in the left sidebar
3. Click "Environment variables" under "Build & deploy"
4. Click "Add a variable" → "Add a single variable"
5. Fill in:
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** `[Your new OpenRouter API key here]`
   - **Scopes:** Check all boxes (builds, functions, post-processing)
6. Click "Create variable"

**What this does:** Stores your API key securely on Netlify's servers. It will NEVER be visible to users of your website.

### Step 8: Trigger a Redeploy

1. Go to "Deploys" tab in Netlify
2. Click "Trigger deploy" → "Deploy site"
3. Wait for deployment to finish (usually 1-2 minutes)
4. Click the live site URL at the top of the page

**Your app is now live!** 🎉

### Step 9: Get a Custom Domain (Optional)

1. In Netlify, go to "Domain management"
2. Click "Add custom domain"
3. Options:
   - **Free Netlify subdomain:** Change `random-name-12345` to `awordforthis` → `https://awordforthis.netlify.app`
   - **Your own domain:** If you own a domain (like awordforthis.com), connect it here

---

## Testing Your Live Site

1. Open your Netlify URL
2. Type an emotion description
3. Click "Find the Word"
4. Verify it works!

If you see errors, check:
- Did you add the environment variable correctly?
- Did you redeploy after adding it?
- Check the "Functions" tab in Netlify to see if `find-word` appears

---

## How to Update Your Site Later

Whenever you make changes to your code:

```bash
git add .
git commit -m "Description of your changes"
git push
```

Netlify will automatically redeploy your site!

---

## Important Security Notes

✅ **Your API key is safe because:**
- It's stored as an environment variable on Netlify (encrypted)
- It only exists in the serverless function (which runs on the server)
- Users CANNOT see it in their browser
- It's NOT in your GitHub repository (thanks to .gitignore)

✅ **What users can see:**
- Your HTML, CSS, and JavaScript code (this is normal for websites)
- The fact that you're using a serverless function
- Nothing sensitive!

❌ **Never commit:**
- API keys directly in code
- .env files
- Credentials or passwords

---

## Troubleshooting

### "Function not found" error
- Make sure your `netlify.toml` file exists
- Verify the function file is at `netlify/functions/find-word.js`
- Check that you pushed all files to GitHub

### "API request failed" error
- Verify you added the environment variable `OPENROUTER_API_KEY`
- Make sure you redeployed after adding it
- Check the variable name is EXACTLY `OPENROUTER_API_KEY`

### Function logs
- In Netlify, go to "Functions" tab
- Click on `find-word`
- View logs to see what's happening

---

## Cost Information

- **Netlify:** FREE for your use case (100GB bandwidth, 300 build minutes/month)
- **OpenRouter API:** Pay per use (check your usage at https://openrouter.ai/)

---

## Need Help?

If something isn't working, let me know and I'll help you troubleshoot!
