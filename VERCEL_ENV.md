# VERCEL DEPLOYMENT - ENVIRONMENT VARIABLES

## ⚠️ CRITICAL: Set These in Vercel Dashboard

Go to: **Your Project → Settings → Environment Variables**

---

## 1. DATABASE_URL

```
postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## 2. DIRECT_URL

```
postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## 3. NEXTAUTH_URL

**⚠️ MUST match your Vercel domain exactly!**

Example: If your Vercel URL is `eeltest.vercel.app`, use:

```
https://eeltest.vercel.app
```

Replace with YOUR actual Vercel domain!

## 4. NEXTAUTH_SECRET

**⚠️ Use a strong random string (min 32 chars)**

```
GMF-EEL-2025-SECRET-KEY-PRODUCTION-SECURE-RANDOM-STRING-FOR-AUTH
```

Or generate new: https://generate-secret.vercel.app/32

## 5. NODE_ENV

```
production
```

---

## Quick Copy-Paste Template

```bash
# Database
DATABASE_URL=postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.ljildxhaxtqacahrurng:cinabenteng@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# NextAuth (⚠️ UPDATE THESE!)
NEXTAUTH_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
NEXTAUTH_SECRET=GMF-EEL-2025-SECRET-KEY-PRODUCTION-SECURE-RANDOM-STRING-FOR-AUTH

# Environment
NODE_ENV=production
```

---

## After Setting Variables

1. **Redeploy** your project in Vercel
2. **Test login** with:
   - Admin: `admin@gmf.co.id` / `admin123`
   - User: `user@gmf.co.id` / `user123`

## Still Not Working?

Check Vercel Function Logs:

1. Go to your deployment
2. Click "Functions" tab
3. Look for errors in `/api/auth/[...nextauth]`
