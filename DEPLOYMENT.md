# Easy Deployment Guide (No Git Required)

This guide will help you deploy your Luxe GRP event management application without needing Git or GitHub.

## Quick Deploy with Netlify (Recommended - Easiest)

### Step 1: Build Your Application
1. Download all your project files to your computer
2. Open a terminal/command prompt in the project folder
3. Run: `npm install` (if you haven't already)
4. Run: `npm run build`
5. This creates a `dist` folder with your built application

### Step 2: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" and create a free account
3. You can sign up with email, no Git required

### Step 3: Deploy Using Drag & Drop
1. On your Netlify dashboard, look for the box that says "Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"
2. Drag your entire `dist` folder into this box
3. Netlify will automatically upload and deploy your site
4. You'll get a URL like `https://random-name-12345.netlify.app`

### Step 4: Add Environment Variables
1. In Netlify, click on your deployed site
2. Go to "Site settings" → "Environment variables"
3. Click "Add a variable" and add these two:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://sypgzzxzpvvblbvpylei.supabase.co`

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cGd6enh6cHZ2YmxidnB5bGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTc0NjIsImV4cCI6MjA3NTY5MzQ2Mn0.r0j6B446YkAl8I4ceKsV6xk_GJJ1ojWFK7SrVyGspZU`

### Step 5: Rebuild with Environment Variables
1. After adding environment variables, go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the build to complete

### Step 6: Test Your Site
1. Click on your site URL
2. Verify events are showing
3. Test the guest list feature - the share link will now work!

## Alternative: Deploy with Vercel CLI

### Step 1: Install Vercel CLI
1. Open terminal/command prompt
2. Run: `npm install -g vercel`
3. This installs Vercel's deployment tool

### Step 2: Login to Vercel
1. Run: `vercel login`
2. Enter your email
3. Check your email and click the verification link

### Step 3: Deploy
1. In your project folder, run: `vercel`
2. Follow the prompts:
   - "Set up and deploy?" → Yes
   - "Which scope?" → Your account
   - "Link to existing project?" → No
   - "What's your project's name?" → luxe-grp-events (or any name)
   - "In which directory is your code located?" → ./ (press Enter)
   - Vercel will auto-detect Vite settings

3. When prompted for environment variables, add:
   - `VITE_SUPABASE_URL` = `https://sypgzzxzpvvblbvpylei.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cGd6enh6cHZ2YmxidnB5bGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTc0NjIsImV4cCI6MjA3NTY5MzQ2Mn0.r0j6B446YkAl8I4ceKsV6xk_GJJ1ojWFK7SrVyGspZU`

4. Your site will be deployed and you'll get a URL like `https://luxe-grp-events.vercel.app`

## Updating Your Deployed Site

### For Netlify Drag & Drop:
1. Make changes to your code locally
2. Run `npm run build` to create a new `dist` folder
3. In Netlify, go to "Deploys" tab
4. Drag the new `dist` folder into the deploy box
5. Your site will update automatically

### For Vercel CLI:
1. Make changes to your code locally
2. Run `vercel --prod` in your project folder
3. Your site will update automatically

## What's Already Configured

Your application is fully ready to deploy:
- Database is set up in Supabase
- All security policies are configured
- SMS guest list feature is ready
- Admin panel is functional
- Image upload is configured

## Testing After Deployment

1. **View Events**: Visit your deployed URL to see your events
2. **Guest List**: Click on an event → Guest List button
3. **Share Link**: Copy the share link and send it via text to a friend
4. **Friend's View**: They'll be able to access the form and sign up
5. **Admin Panel**: Go to `/admin` to manage events and view guest lists

## Troubleshooting

**Guest list link still not working?**
- Make sure you added BOTH environment variables in Netlify/Vercel
- Rebuild/redeploy after adding environment variables
- Clear your browser cache and try again

**Images not showing?**
- Images are stored in Supabase and should work automatically
- Check the browser console for any errors

**Admin login not working?**
- Use the same credentials you set up in development
- Check that your Supabase URL is correct in environment variables

## Getting Help

If you run into issues:
1. Check the browser console (F12) for error messages
2. Look at Netlify/Vercel deployment logs
3. Verify environment variables are set correctly
4. Make sure you rebuilt after adding environment variables

## Your Deployment Checklist

- [ ] Run `npm run build` locally
- [ ] Create Netlify or Vercel account
- [ ] Deploy using drag & drop or CLI
- [ ] Add both environment variables
- [ ] Trigger a new deploy/rebuild
- [ ] Test the site URL
- [ ] Test guest list sharing feature
- [ ] Share your live site URL!

**That's it! Your event management system is now live and accessible to everyone.**
