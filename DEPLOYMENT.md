# Deployment Guide - Vercel

## Environment Variables Setup

Configure these environment variables in your Vercel project:

### 1. Database (Supabase)

```
DATABASE_URL=postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### 2. NextAuth Configuration

**NEXTAUTH_URL** (CRITICAL!)

- For production: `https://your-app-name.vercel.app`
- Replace `your-app-name` with your actual Vercel domain
- Example: `https://eel-gmf.vercel.app`

```
NEXTAUTH_URL=https://your-app-name.vercel.app
```

**NEXTAUTH_SECRET** (CRITICAL!)

- Must be a secure random string (minimum 32 characters)
- Generate at: https://generate-secret.vercel.app/32
- Or use: `openssl rand -base64 32`

```
NEXTAUTH_SECRET=GMF-EEL-2025-SECRET-KEY-PRODUCTION-SECURE-RANDOM-STRING-FOR-AUTH
```

### 3. Node Environment

```
NODE_ENV=production
```

## Steps to Deploy

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Fix authentication for production"
   git push
   ```

2. **Configure Vercel Environment Variables**

   - Go to your Vercel project dashboard
   - Navigate to: Settings → Environment Variables
   - Add all variables above
   - Apply to: Production, Preview, and Development

3. **Redeploy**
   - Vercel will auto-deploy on git push
   - Or manually trigger: Deployments → Redeploy

## Database Seeding

Ensure your Supabase database has been seeded with user accounts:

```bash
npx prisma db seed
```

Login credentials:

- **Admin**: admin@gmf.co.id / admin123
- **User**: user@gmf.co.id / user123

## Troubleshooting

### Login not working

1. Check `NEXTAUTH_URL` matches your Vercel domain exactly
2. Verify `NEXTAUTH_SECRET` is set (not default value)
3. Check Vercel logs for authentication errors
4. Ensure database is seeded with users

### Database connection errors

1. Verify `DATABASE_URL` uses port 6543 (transaction pooler)
2. Verify `DIRECT_URL` uses port 5432 (direct connection)
3. Check Supabase project is active
4. Test connection: `npx prisma db push`

### Session/JWT errors

1. Clear browser cookies
2. Try incognito/private window
3. Check Vercel function logs for detailed errors
