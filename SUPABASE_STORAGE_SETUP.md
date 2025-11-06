# Setup Supabase Storage for Image Uploads

## Langkah-langkah Setup

### 1. Create Storage Bucket di Supabase

1. **Login ke Supabase Dashboard**: https://supabase.com/dashboard
2. **Pilih project** Anda (project ID: `ljildxhaxtqacahrurng`)
3. **Go to**: **Storage** (sidebar kiri)
4. **Click**: **New bucket**
5. **Bucket name**: `drawings`
6. **Public bucket**: ✅ **CHECKED** (centang ini agar gambar bisa diakses public)
7. **Click**: **Create bucket**

### 2. Get Supabase API Keys

1. **Go to**: Project Settings (icon ⚙️ di sidebar bawah)
2. **Click**: **API** tab
3. **Copy** values ini:
   - **Project URL**: `https://ljildxhaxtqacahrurng.supabase.co`
   - **anon public** key: Token panjang yang dimulai dengan `eyJhbGci...`

### 3. Update .env Local (untuk testing)

Edit file `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://ljildxhaxtqacahrurng.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG... PASTE YOUR ANON KEY"
```

### 4. Add Environment Variables di Vercel

1. **Go to**: Vercel Dashboard → Your Project
2. **Go to**: Settings → Environment Variables
3. **Add these 2 variables**:

**Variable 1:**

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ljildxhaxtqacahrurng.supabase.co
Apply to: Production, Preview, Development
```

**Variable 2:**

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [PASTE YOUR ANON KEY FROM STEP 2]
Apply to: Production, Preview, Development
```

4. **Save**

### 5. Push & Deploy

```bash
git add .
git commit -m "Setup Supabase Storage for image uploads"
git push
```

Vercel akan auto-deploy!

---

## Testing Upload

1. **Login** sebagai Admin
2. **Go to**: Drawings Management
3. **Click**: "Create New Drawing"
4. **Upload image** → Should work! ✅

---

## Verify Upload

Check di Supabase Dashboard:

- Go to: **Storage** → **drawings** bucket
- Gambar yang di-upload akan muncul di sini

Public URL format:

```
https://ljildxhaxtqacahrurng.supabase.co/storage/v1/object/public/drawings/[timestamp]-[filename]
```

---

## Troubleshooting

### Error: "Supabase configuration missing"

- ✅ Pastikan env vars sudah di-set di Vercel
- ✅ Redeploy setelah add env vars

### Error: "new row violates row-level security policy"

- ✅ Pastikan bucket `drawings` di-create sebagai **Public bucket**
- ✅ Atau tambahkan RLS policy (lihat di bawah)

### Gambar upload tapi tidak muncul (403 error)

- ✅ Bucket harus Public
- ✅ Check RLS policies di Supabase

---

## RLS Policy (Jika Diperlukan)

Jika bucket tidak public, tambahkan policy:

1. Go to: Storage → drawings → Policies
2. New Policy → For full customization
3. **Policy for SELECT**:
   - Name: `Public read access`
   - Target roles: `public`
   - USING expression: `true`
4. **Policy for INSERT** (jika perlu):
   - Name: `Authenticated insert`
   - Target roles: `authenticated`
   - WITH CHECK: `true`

Save dan test upload lagi!
