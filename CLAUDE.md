## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://unijos-vth.vercel.app
- Deploy workflow: auto-deploy on push to main
- Deploy status command: Vercel Production Deployment
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://unijos-vth.vercel.app

### Custom deploy hooks
- Pre-merge: npm run build
- Deploy trigger: automatic on push to main
- Deploy status: poll production URL
- Health check: https://unijos-vth.vercel.app
