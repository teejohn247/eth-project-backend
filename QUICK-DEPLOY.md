# Quick Deployment Guide 🚀

## ✅ What's Ready

Your Edo Talent Hunt Backend is now **deployment-ready** with:

- ✅ **Dockerfile** for containerization
- ✅ **Google Cloud Run configuration**
- ✅ **GitHub Actions CI/CD pipeline**
- ✅ **Environment variables setup**
- ✅ **Production configuration**
- ✅ **Swagger API documentation**
- ✅ **Health monitoring**

## 🎯 Next Steps (Manual)

### 1. Create Google Cloud Project
```bash
gcloud projects create edo-talent-hunt-backend
gcloud config set project edo-talent-hunt-backend
```

### 2. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com
```

### 3. Setup Service Account
```bash
gcloud iam service-accounts create github-actions
gcloud iam service-accounts keys create key.json --iam-account=github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com
```

### 4. Grant Permissions
```bash
gcloud projects add-iam-policy-binding edo-talent-hunt-backend --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" --role="roles/run.admin"
gcloud projects add-iam-policy-binding edo-talent-hunt-backend --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding edo-talent-hunt-backend --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" --role="roles/storage.admin"
```

### 5. Store Secrets in Secret Manager
```bash
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "mongodb://connection-string" | gcloud secrets create mongodb-uri --data-file=-
echo -n "smtp-relay.brevo.com" | gcloud secrets create email-host --data-file=-
echo -n "587" | gcloud secrets create email-port --data-file=-
echo -n "tolu.ajuwon@aceall.io" | gcloud secrets create email-user --data-file=-
echo -n "your-brevo-password" | gcloud secrets create email-pass --data-file=-
echo -n "noreply@yourdomain.com" | gcloud secrets create email-from --data-file=-
```

### 6. GitHub Repository Setup

1. **Create GitHub Repository**
2. **Add Secrets in GitHub**: Settings → Secrets → Actions
   - `GCP_PROJECT_ID`: `edo-talent-hunt-backend`
   - `GCP_SA_KEY`: Contents of `key.json` (base64 encoded)

3. **Push Code**
   ```bash
   git init
   git add .
   git commit -m "Initial deployment setup"
   git branch -M main
   git remote add origin https://github.com/yourusername/edo-talent-hunt-backend.git
   git push -u origin main
   ```

## 🚀 Automatic Deployment

Once you push to the `main` branch, GitHub Actions will:

1. ✅ Run tests and linting
2. ✅ Build the Docker image
3. ✅ Push to Google Container Registry
4. ✅ Deploy to Cloud Run
5. ✅ Provide the service URL

## 📊 Monitoring

### API Endpoints
- **Base URL**: `https://your-service-url/api/v1`
- **Health Check**: `https://your-service-url/api/v1/health`
- **API Documentation**: `https://your-service-url/api-docs`

### View Logs
```bash
gcloud logs read "resource.type=cloud_run_revision" --limit=50
```

## 🔐 Environment Variables (Production)

The following are configured via Google Secret Manager:
- `JWT_SECRET`
- `MONGODB_URI`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

## 📚 Features Deployed

- ✅ **Authentication System** (Register, Login, OTP verification)
- ✅ **JWT-based Authorization**
- ✅ **Email Service** (Brevo/Sendinblue)
- ✅ **MongoDB Integration**
- ✅ **Rate Limiting**
- ✅ **CORS Configuration**
- ✅ **Security Headers** (Helmet)
- ✅ **Interactive API Documentation** (Swagger)
- ✅ **Health Monitoring**

## 🎉 Ready to Deploy!

Your backend is production-ready and follows Google Cloud best practices for security, scalability, and monitoring.
