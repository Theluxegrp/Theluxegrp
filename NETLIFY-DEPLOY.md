# Deploy to Netlify - Simple Step-by-Step Guide

## Step 1: Create Your Production Build

First, make sure your app builds correctly:

```bash
npm run build
```

This creates a `dist` folder with your production-ready files.

## Step 2: Sign Up for Netlify (if you haven't already)

1. Go to [https://www.netlify.com](https://www.netlify.com)
2. Click "Sign up" in the top right
3. Sign up with GitHub, GitLab, Bitbucket, or Email

## Step 3: Deploy Your Site

### Option A: Drag and Drop (Easiest - No Git Required)

1. Log into [https://app.netlify.com](https://app.netlify.com)
2. Scroll down to the bottom of the page
3. Look for the box that says **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**
4. **Drag your `dist` folder** (from your project) into that box
5. Wait for the upload to complete (usually takes 10-30 seconds)
6. Done! Netlify will give you a URL like `https://random-name-123456.netlify.app`

### Option B: Manual Upload via Sites Page

1. Log into [https://app.netlify.com](https://app.netlify.com)
2. Click the **"Add new site"** button
3. Select **"Deploy manually"**
4. Drag your `dist` folder into the upload area
5. Wait for deployment to complete
6. Done! Your site is live

## Step 4: Add Your Environment Variables

Your app needs Supabase credentials to work. Add them to Netlify:

1. In Netlify, click on your deployed site
2. Go to **Site configuration** → **Environment variables**
3. Click **"Add a variable"** and add these two:

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://sypgzzxzpvvblbvpylei.supabase.co`

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cGd6enh6cHZ2YmxidnB5bGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTc0NjIsImV4cCI6MjA3NTY5MzQ2Mn0.r0j6B446YkAl8I4ceKsV6xk_GJJ1ojWFK7SrVyGspZU`

4. Click **"Save"**

## Step 5: Redeploy with Environment Variables

Since you added environment variables after the first deploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for the new deployment to finish (1-2 minutes)

## Step 6: Get Your Live URL

1. Your site URL is shown at the top of the Netlify dashboard
2. It will look like: `https://random-name-123456.netlify.app`
3. Click it to visit your live site!

## Optional: Custom Domain

Want a custom domain like `myevents.com`?

1. In Netlify, go to **Domain management**
2. Click **"Add a domain"**
3. Follow the instructions to either:
   - Buy a domain through Netlify, or
   - Connect a domain you already own

---

## Updating Your Site Later

Whenever you make changes to your app:

1. Run `npm run build` to create a new build
2. Go to your Netlify site dashboard
3. Drag the new `dist` folder to the deploy area
4. Your site updates automatically!

---

## Troubleshooting

**Site shows blank page?**
- Make sure you added the environment variables (Step 4)
- Make sure you redeployed after adding them (Step 5)

**Build errors?**
- Run `npm run build` locally first to catch any errors
- Fix any errors before trying to deploy

**Need help?**
- Check [Netlify's documentation](https://docs.netlify.com)
- Or contact me for assistance!
