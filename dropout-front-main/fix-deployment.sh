#!/bin/bash

# Quick deployment fix script
# Run this when you get Firebase unauthorized domain errors

echo "🔥 Firebase Deployment Fix"
echo "=========================="
echo ""
echo "Current deployment URL detected from error:"
echo "dropout-front-29gn-offhna73k-shlok2345788s-projects.vercel.app"
echo ""
echo "📋 Steps to fix:"
echo ""
echo "1. Go to Firebase Console:"
echo "   https://console.firebase.google.com/"
echo ""
echo "2. Select project: student-prediction-eec30"
echo ""
echo "3. Go to: Authentication → Settings → Authorized domains"
echo ""
echo "4. Add this domain:"
echo "   dropout-front-29gn-offhna73k-shlok2345788s-projects.vercel.app"
echo ""
echo "5. Also add wildcard for future deployments:"
echo "   *.vercel.app"
echo ""
echo "6. Wait 2-3 minutes and refresh your deployment"
echo ""
echo "✅ After adding the domain, your authentication should work!"