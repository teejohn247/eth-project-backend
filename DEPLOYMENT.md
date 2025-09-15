# Deployment Guide - Edo Talent Hunt Backend

This guide walks you through deploying the Edo Talent Hunt Backend to Google Cloud Platform using GitHub Actions.

## Prerequisites

1. **Google Cloud Platform Account**
2. **GitHub Repository**
3. **MongoDB Database** (MongoDB Atlas recommended)
4. **Email Service** (Brevo/Sendinblue configured)

## Setup Steps

### 1. Google Cloud Platform Setup

1. **Create a new GCP Project**
   ```bash
   gcloud projects create edo-talent-hunt-backend --name="Edo Talent Hunt Backend"
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

3. **Create a Service Account**
   ```bash
   gcloud iam service-accounts create github-actions \
     --description="Service account for GitHub Actions" \
     --display-name="GitHub Actions"
   ```

4. **Grant necessary permissions**
   ```bash
   gcloud projects add-iam-policy-binding edo-talent-hunt-backend \
     --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" \
     --role="roles/cloudbuild.builds.editor"
   
   gcloud projects add-iam-policy-binding edo-talent-hunt-backend \
     --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   
   gcloud projects add-iam-policy-binding edo-talent-hunt-backend \
     --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   
   gcloud projects add-iam-policy-binding edo-talent-hunt-backend \
     --member="serviceAccount:github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com" \
     --role="roles/secretmanager.admin"
   ```

5. **Create and download Service Account Key**
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@edo-talent-hunt-backend.iam.gserviceaccount.com
   ```

### 2. Google Secret Manager Setup

Store sensitive environment variables in Google Secret Manager:

```bash
# JWT Secret
echo -n "your-super-secure-jwt-secret-key-here" | gcloud secrets create jwt-secret --data-file=-

# MongoDB Connection String
echo -n "mongodb+srv://username:password@cluster.mongodb.net/edo-talent-hunt" | gcloud secrets create mongodb-uri --data-file=-

# Email Configuration
echo -n "smtp-relay.brevo.com" | gcloud secrets create email-host --data-file=-
echo -n "587" | gcloud secrets create email-port --data-file=-
echo -n "your-email@domain.com" | gcloud secrets create email-user --data-file=-
echo -n "your-brevo-password" | gcloud secrets create email-pass --data-file=-
echo -n "noreply@yourdomain.com" | gcloud secrets create email-from --data-file=-
```

### 3. GitHub Repository Setup

1. **Create GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add the following secrets:
   - `GCP_PROJECT_ID`: Your GCP project ID (e.g., edo-talent-hunt-backend)
   - `GCP_SA_KEY`: Contents of the key.json file (base64 encoded)

2. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

### 4. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster
   - Create database user
   - Whitelist your IP addresses (or 0.0.0.0/0 for Cloud Run)
   - Get connection string

2. **Update Secret Manager**
   ```bash
   echo -n "your-actual-mongodb-connection-string" | gcloud secrets versions add mongodb-uri --data-file=-
   ```

### 5. Deploy

1. **Manual Deployment**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Automatic Deployment**
   - Push to main/master branch
   - GitHub Actions will automatically deploy

### 6. Verify Deployment

1. **Check Cloud Run Service**
   ```bash
   gcloud run services list
   ```

2. **Get Service URL**
   ```bash
   gcloud run services describe edo-talent-hunt-backend --region=us-central1 --format="value(status.url)"
   ```

3. **Test API**
   ```bash
   curl https://your-service-url/api/v1/health
   ```

## Environment Variables

The following environment variables are required for production:

- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET` (from Secret Manager)
- `MONGODB_URI` (from Secret Manager)
- `EMAIL_HOST` (from Secret Manager)
- `EMAIL_PORT` (from Secret Manager)
- `EMAIL_USER` (from Secret Manager)
- `EMAIL_PASS` (from Secret Manager)
- `EMAIL_FROM` (from Secret Manager)

## Monitoring and Logging

1. **View Logs**
   ```bash
   gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=edo-talent-hunt-backend" --limit=50
   ```

2. **Monitor Performance**
   - Go to Cloud Run console
   - View metrics and logs

## Security Considerations

1. **Environment Variables**: All sensitive data stored in Secret Manager
2. **CORS**: Configured for production domains
3. **Rate Limiting**: Enabled for API protection
4. **Authentication**: JWT-based authentication
5. **Helmet**: Security headers enabled

## Troubleshooting

1. **Build Failures**: Check Cloud Build logs
2. **Runtime Errors**: Check Cloud Run logs
3. **Database Connection**: Verify MongoDB Atlas whitelist
4. **Email Issues**: Verify Brevo credentials

## API Documentation

Once deployed, access the interactive API documentation at:
`https://your-service-url/api-docs`

## Health Check

Monitor service health at:
`https://your-service-url/api/v1/health`
