# GUARDIAN SENTINEL - QUICK START

## 📦 YOUR DEPLOYMENT PACKAGE IS READY

Location: `/home/claude/guardian-deploy-ready/`

**Fixes Applied:**
✅ CAD viewer shows upgrade message
✅ Routing table uses agent data first
✅ Debug logging for troubleshooting
✅ render.yaml for auto-deployment
✅ Complete deployment guide

---

## 🚀 DEPLOY NOW - COPY THESE COMMANDS

### 1. Upload to GitHub:

```bash
cd /home/claude/guardian-deploy-ready

# Login to GitHub (first time only)
gh auth login

# Create repo and push
git init
git add .
git commit -m "Guardian Sentinel - Production Ready"
gh repo create guardian-sentinel-production --public --source=. --push
```

**That's it! Code is on GitHub.**

---

### 2. Deploy to Render:

1. Open: https://dashboard.render.com
2. Click: **New +** → **Blueprint**
3. Connect: `guardian-sentinel-production` repo
4. Click: **Apply**

**Render auto-configures everything from render.yaml**

---

### 3. Add API Keys in Render:

Go to your service → Environment tab → Add:

```
FORGE_API_KEY=your_manus_key
GEMINI_API_KEY=your_gemini_key
```

Get Gemini key: https://ai.google.dev/

---

### 4. Deploy Frontend to Vercel:

1. Open: https://vercel.com
2. Import: `guardian-sentinel-production`
3. Root Directory: `client`
4. Add env var: `VITE_API_URL=https://guardian-sentinel-api.onrender.com`
5. Deploy!

---

## ✅ DONE!

Your Guardian OS is now live on Render + Vercel.

**Test it:**
- Backend health: https://guardian-sentinel-api.onrender.com/health
- Frontend: https://your-app.vercel.app

**Read full guide:** See DEPLOYMENT.md for detailed instructions

---

## 📞 NEED HELP?

All files are in: `/home/claude/guardian-deploy-ready/`

- `render.yaml` - Auto-configures Render
- `DEPLOYMENT.md` - Full deployment guide
- `package.json` - Build/start scripts ready
- All fixes applied to code

**Just follow the 4 steps above and you're live!**
