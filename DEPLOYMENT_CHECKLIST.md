# Deployment Checklist

## ✅ Pre-Deployment Checks Completed

### 1. Code Quality
- ✅ All merge conflicts resolved
- ✅ TypeScript errors fixed
- ✅ Linting errors resolved
- ✅ Consistent import statements (ES6 modules)

### 2. Build Configuration
- ✅ `next.config.mjs` properly configured
- ✅ TypeScript config valid
- ✅ All dependencies in `package.json`

## 🔧 Required Environment Variables

Set these environment variables in your deployment platform (Vercel, Netlify, etc.):

### Required (Critical)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Site URL (for redirects and callbacks)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Optional (Auto-detected on Vercel)
```bash
# Vercel automatically sets these:
VERCEL_URL=auto-set-by-vercel
VERCEL_BLOB_READ_WRITE_TOKEN=auto-set-by-vercel (if using Vercel Blob)
```

### Notes:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `STRIPE_SECRET_KEY` should NEVER be exposed to the browser
- `NEXT_PUBLIC_SITE_URL` is used for OAuth callbacks and payment redirects
- If deploying to Vercel, `VERCEL_URL` is automatically set

## 📦 Build Commands

The project uses these commands:
- `pnpm run build` - Build for production
- `pnpm run dev` - Development server
- `pnpm run start` - Start production server

## 🚀 Deployment Steps

### For Vercel:
1. Connect your repository to Vercel
2. Set all required environment variables in Vercel dashboard
3. Vercel will automatically:
   - Detect Next.js framework
   - Install dependencies (`pnpm install`)
   - Run build (`pnpm run build`)
   - Deploy

### For Other Platforms:
1. Ensure Node.js 18+ is available
2. Set all environment variables
3. Run `pnpm install`
4. Run `pnpm run build`
5. Start with `pnpm run start`

## ⚠️ Important Notes

1. **Vercel Blob Storage**: The upload API uses `@vercel/blob`. On Vercel, the token is auto-provided. For other platforms, you may need to set `BLOB_READ_WRITE_TOKEN`.

2. **Image Optimization**: `next.config.mjs` has `unoptimized: true` - images won't be optimized by Next.js. Consider enabling optimization for better performance.

3. **TypeScript Build Errors**: Currently set to `ignoreBuildErrors: true` in `next.config.mjs`. Consider fixing all TypeScript errors and removing this for production.

4. **Database**: Ensure your Supabase database has all required tables and migrations applied.

5. **Stripe Webhooks**: If using Stripe webhooks, configure the webhook endpoint in Stripe dashboard:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, etc.

## 🔍 Post-Deployment Verification

After deployment, verify:
- [ ] Homepage loads correctly
- [ ] Authentication (login/signup) works
- [ ] Product pages load
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] Payment processing works
- [ ] Image uploads work (if using Vercel Blob)
- [ ] Admin dashboard accessible (if applicable)
- [ ] API routes respond correctly

## 📝 Files Modified for Deployment Readiness

1. `components/shop-filters.tsx` - Fixed TypeScript error with array type checking
2. `lib/actions/payment-actions.ts` - Fixed inconsistent Stripe import (changed from `require` to ES6 `import`)
3. All merge conflicts resolved across the codebase

## 🆘 Troubleshooting

### Build Fails:
- Check all environment variables are set
- Verify Node.js version (18+)
- Check for TypeScript errors (even if ignored)
- Review build logs for specific errors

### Runtime Errors:
- Check browser console for client-side errors
- Check server logs for API errors
- Verify environment variables are accessible
- Ensure database connections are working

### Payment Issues:
- Verify Stripe keys are correct
- Check webhook configuration
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly

### Image Upload Issues:
- On Vercel: Vercel Blob token is auto-provided
- On other platforms: Set `BLOB_READ_WRITE_TOKEN` or configure alternative storage

