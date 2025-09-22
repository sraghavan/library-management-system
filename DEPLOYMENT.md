# 🚀 Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Choose a name like `library-management-system`
3. Make it public (for free Vercel hosting)
4. Don't initialize with README (we already have one)

## Step 2: Push to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/sraghavan/library-management-system.git

# Push to GitHub
git push -u origin main
```

## Step 3: Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project:
   - Choose a name: `library-management`
   - Generate a strong password
   - Choose a region close to you
3. Wait for the project to be created (2-3 minutes)

### Configure Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase_migrations.sql`
3. Click "Run" to create tables and sample data

### Get Database Credentials

1. Go to Settings → API
2. Copy your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

## Step 4: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the React app

### Configure Environment Variables

1. In Vercel, go to your project settings
2. Go to Environment Variables
3. Add these variables:
   ```
   REACT_APP_SUPABASE_URL=your-supabase-url-here
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```
4. Click "Deploy"

## Step 5: Test Your Deployment

1. Visit your Vercel URL (e.g., `your-project.vercel.app`)
2. Test adding books and users
3. Verify data persists across browser sessions

## Step 6: Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Go to Domains
3. Add your custom domain and follow DNS instructions

## Database Management

### View Data
- Use Supabase Table Editor to view/edit data
- Use API tab to see real-time logs

### Backup Data
- Use the Excel export feature in the app
- Supabase automatically backs up your data

### Reset Database
- Run the SQL migration again to reset tables
- Or use Supabase dashboard to drop/recreate tables

## Troubleshooting

### Build Errors
- Check Vercel build logs
- Ensure all environment variables are set
- Verify package.json dependencies

### Database Connection Issues
- Verify Supabase URL and key in environment variables
- Check Supabase project is active
- Ensure RLS policies allow operations

### App Not Loading
- Check browser console for errors
- Verify Vercel deployment succeeded
- Test with incognito/private browsing mode

## Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth, unlimited personal projects
- **Supabase**: 500MB database, 2 projects, 50k monthly active users

### When to Upgrade
- Heavy usage beyond free limits
- Need for custom domains with SSL
- Enhanced support requirements

## Performance Optimization

### Vercel
- Automatic CDN and edge caching
- Perfect for React single-page applications
- Fast global distribution

### Supabase
- Built-in connection pooling
- Real-time subscriptions
- Automatic scaling

You're all set! 🎉

Your library management system is now live and accessible worldwide!