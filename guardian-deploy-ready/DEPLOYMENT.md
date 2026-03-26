# GUARDIAN SENTINEL - RENDER DEPLOYMENT GUIDE

## ✅ FIXES APPLIED:

1. **CAD Viewer** - Shows upgrade message (not boxes)
2. **Routing Table** - Uses agent data first, shows warning if fallback
3. **Debug Logging** - Console logs show what data is received

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Upload to GitHub

On your Termux terminal:

```bash
cd /home/claude/guardian-deploy-ready

# Install GitHub CLI if needed
pkg install gh

# Login to GitHub
gh auth login
# Choose: GitHub.com
# Choose: HTTPS
# Choose: Login with a web browser
# Copy the code it shows
# Open browser and go to: https://github.com/login/device
# Paste the code

# Initialize git
git init
git add .
git commit -m "Guardian Sentinel - Ready for Render"

# Create GitHub repo and push
gh repo create guardian-sentinel-production --public --source=. --push
```

---

### Step 2: Deploy to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** dropdown
3. Select **"Blueprint"**
4. Click **"Connect a repository"**
5. Find `guardian-sentinel-production`
6. Click **"Connect"**
7. Render will auto-configure from `render.yaml`
8. Click **"Apply"**

**Render will create:**
- ✅ Web service (backend)
- ✅ PostgreSQL database
- ✅ Auto-link them together

---

### Step 3: Add API Keys

Once deployed:

1. Click on your **guardian-sentinel-api** service
2. Go to **Environment** tab
3. Click **"Add Environment Variable"**

**Add these keys:**

```
FORGE_API_KEY=your_manus_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Optional (but recommended):**
```
GROQ_API_KEY=your_groq_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

4. Click **"Save Changes"**
5. Service will auto-restart

---

### Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import `guardian-sentinel-production` repo
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add environment variable:
```
VITE_API_URL=https://guardian-sentinel-api.onrender.com
```
(Replace with your actual Render URL)

6. Click **"Deploy"**

---

### Step 5: Update Backend CORS

After getting your Vercel URL:

1. Go back to Render dashboard
2. Click your API service
3. Go to **Environment** tab
4. Add:
```
CORS_ORIGIN=https://your-app.vercel.app
```

5. Save and restart

---

## ✅ TESTING CHECKLIST

### Test Backend:
```
https://guardian-sentinel-api.onrender.com/health
```
Should return: `{"status":"ok"}`

### Test Frontend:
```
https://your-app.vercel.app
```
Should load Guardian Sentinel

### Test CAD Viewer:
1. Go to manufacturing section
2. Look for 3D viewer
3. Should show "3D Visualization" message
4. ✅ NO BOXES

### Test Routing:
1. Upload a CAD file
2. Go to Manufacturing Routing section
3. Check browser console (F12)
4. Should see: `[Routing Table] Manufacturing Agent Data:`
5. If using fallback, should see yellow warning
6. ✅ ROUTING SHOWS CORRECTLY

### Test Sales Agent:
1. Click chat bubble (bottom right)
2. Type: "Hello"
3. Should get AI response
4. ✅ AGENT WORKS

---

## 🔑 GET API KEYS

### Manus/Forge API Key:
Already have from your Manus deployment

### Gemini API Key (FREE):
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create project
4. Generate key
5. Copy key

### Groq API Key (FREE - Optional):
1. Go to https://console.groq.com/
2. Sign up
3. Go to API Keys
4. Create key
5. Copy key

### Anthropic Claude (Paid - Optional):
1. Go to https://console.anthropic.com/
2. Sign up
3. Add payment method
4. Create API key
5. Copy key

---

## 💰 COSTS

- **Render Backend:** FREE (750 hours/month)
- **Render Database:** FREE (90 days, then $7/month)
- **Vercel Frontend:** FREE (unlimited)
- **Gemini API:** FREE (60 req/min)
- **Groq API:** FREE (30 req/min)
- **Anthropic:** Paid ($15 per million tokens)

**Total: $0/month for first 90 days**

---

## 🐛 TROUBLESHOOTING

### Backend not deploying:
- Check Render logs for errors
- Verify package.json has correct scripts
- Make sure DATABASE_URL is set

### Sales agent not responding:
- Verify GEMINI_API_KEY is set correctly
- Check Render logs for API errors
- Test key at https://ai.google.dev/

### Routing shows fallback:
- Check console for `[Routing Table]` logs
- Verify Manufacturing Agent is running
- Check backend logs for agent execution

### Frontend can't connect to backend:
- Verify VITE_API_URL is correct
- Check CORS_ORIGIN is set on backend
- Test backend health endpoint

---

## 📞 SUPPORT COMMANDS

**View backend logs:**
```
# In Render dashboard
Click service → Logs tab
```

**Check database connection:**
```
# In Render dashboard
Click database → Info tab → Copy Internal URL
```

**Restart service:**
```
# In Render dashboard
Click service → Manual Deploy → Deploy latest commit
```

---

## 🎉 SUCCESS!

Your URLs:
- **Frontend:** https://guardian-sentinel.vercel.app
- **Backend:** https://guardian-sentinel-api.onrender.com
- **Health:** https://guardian-sentinel-api.onrender.com/health

**Share the frontend URL with prospects!**

---

## 📧 NEXT STEPS

After Guardian OS is live:

1. Test the full quote generation workflow
2. Share demo link with aerospace manufacturers
3. Use your separate sales-agent to send campaigns
4. Monitor leads and close deals!

**You're ready to sell! 💰**
