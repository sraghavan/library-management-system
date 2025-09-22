# 🚀 Deployment Guide - PlanetScale Edition

## Prerequisites
- GitHub account
- Vercel account (free)
- PlanetScale account (free)

## Step 1: Set Up PlanetScale Database

1. Go to [PlanetScale](https://planetscale.com) and create a free account
2. Create a new database:
   - Choose a name: `library-management`
   - Select a region close to you
3. Wait for the database to be created (1-2 minutes)

### Configure Database Schema

1. Go to your PlanetScale dashboard
2. Click on your database → "Console" tab
3. Copy and paste the contents of `planetscale_migrations.sql`
4. Click "Execute" to create tables and sample data

### Get Database Credentials

1. Go to your database → "Connect" tab
2. Select "Connect with: General"
3. Copy your connection details:
   - Host (e.g., `aws.connect.psdb.cloud`)
   - Username
   - Password
   - Database name

## Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository: `sraghavan/library-management-system`
4. Vercel will auto-detect the React app

### Configure Environment Variables

1. In Vercel, go to your project settings
2. Go to Environment Variables
3. Add these variables:
   ```
   REACT_APP_DB_HOST=your-planetscale-host
   REACT_APP_DB_USERNAME=your-planetscale-username
   REACT_APP_DB_PASSWORD=your-planetscale-password
   REACT_APP_DB_NAME=your-database-name
   ```
4. Click "Deploy"

## Step 3: Test Your Deployment

1. Visit your Vercel URL (e.g., `your-project.vercel.app`)
2. Test adding books and users
3. Verify data persists across browser sessions

## Free Tier Limits

### PlanetScale Free Tier
- **Storage**: 1GB database storage
- **Reads**: 1 billion reads per month
- **Writes**: 10 million writes per month
- **Connections**: 1,000 concurrent connections

### Vercel Free Tier
- **Bandwidth**: 100GB per month
- **Build time**: 6,000 minutes per month
- **Serverless functions**: 100GB-hours per month

## Database Management

### View Data
- Use PlanetScale's database console to view/edit data
- Use "Insights" tab to monitor query performance

### Backup Data
- Use the Excel export feature in the app
- PlanetScale automatically backs up your data

### Reset Database
- Run the SQL migration again to reset tables
- Or use PlanetScale console to drop/recreate tables

## Troubleshooting

### Build Errors
- Check Vercel build logs
- Ensure all environment variables are set
- Verify package.json dependencies

### Database Connection Issues
- Verify PlanetScale credentials in environment variables
- Check database is active and not sleeping
- Ensure SSL is enabled (PlanetScale requires SSL)

### App Not Loading
- Check browser console for errors
- Verify Vercel deployment succeeded
- Test with incognito/private browsing mode

## Performance Tips

### PlanetScale
- Built-in connection pooling
- Global read replicas
- Automatic scaling

### Vercel
- Automatic CDN and edge caching
- Perfect for React single-page applications
- Fast global distribution

## When to Upgrade

### PlanetScale
- When you exceed 1GB storage
- Need for database branching features
- Require advanced analytics

### Vercel
- Heavy usage beyond free limits
- Need for team collaboration features
- Enhanced support requirements

You're all set! 🎉

Your library management system is now live with PlanetScale database!