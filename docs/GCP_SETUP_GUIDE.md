# GCP Cloud Storage Setup Guide

## Overview
This guide will walk you through setting up Google Cloud Platform (GCP) Cloud Storage for the Affiliate A/B Testing platform. This enables secure, scalable, and globally accessible image storage for your marketing campaigns.

## Prerequisites
- Google Account
- Access to Google Cloud Console
- Basic understanding of cloud services

## Step 1: Create GCP Project

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### 1.2 Create New Project
1. Click the project dropdown in the top navigation
2. Click **"New Project"**
3. Fill in project details:
   - **Project name**: `youvit-affiliate-storage`
   - **Project ID**: `youvit-affiliate-storage` (must be globally unique)
   - **Organization**: Select your organization (if applicable)
4. Click **"Create"**
5. Wait for project creation (1-2 minutes)

## Step 2: Enable Required APIs

### 2.1 Enable Cloud Storage API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Cloud Storage API"
3. Click on **"Cloud Storage API"**
4. Click **"Enable"**
5. Wait for API to be enabled

### 2.2 Verify API Status
- Go to **APIs & Services** → **Enabled APIs**
- Confirm "Cloud Storage API" appears in the list

## Step 3: Create Storage Bucket

### 3.1 Navigate to Cloud Storage
1. In the left sidebar, go to **Cloud Storage** → **Buckets**
2. Click **"Create Bucket"**

### 3.2 Configure Bucket Settings
1. **Bucket name**: `youvit-affiliate-images`
   - Must be globally unique
   - Use lowercase letters, numbers, and hyphens only
   - Cannot be changed later

2. **Location type**: Region
   - **Region**: `asia-southeast1` (Singapore)
   - Choose closest region to your users

3. **Storage class**: Standard
   - Best for frequently accessed data

4. **Access control**: Uniform (bucket-level)
   - Simplifies permission management

5. **Public access prevention**: **OFF**
   - Required for public image access

6. **Data protection**: Leave defaults
   - Can be configured later if needed

7. Click **"Create"**

### 3.3 Make Bucket Publicly Readable
1. Select your created bucket
2. Go to **"Permissions"** tab
3. Click **"Grant Access"**
4. Add new principal:
   - **New principals**: `allUsers`
   - **Role**: `Storage Object Viewer`
5. Click **"Save"**
6. Confirm the warning about public access

## Step 4: Create Service Account

### 4.1 Navigate to Service Accounts
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**

### 4.2 Service Account Details
1. **Service account name**: `affiliate-storage-service`
2. **Service account ID**: Auto-generated (e.g., `affiliate-storage-service`)
3. **Description**: `Service account for affiliate platform image storage`
4. Click **"Create and Continue"**

### 4.3 Grant Permissions
1. **Select a role**: Click the dropdown
2. Search and select: **"Storage Admin"**
   - For more security, use **"Storage Object Admin"** instead
3. Click **"Continue"**
4. Skip "Grant users access" (optional)
5. Click **"Done"**

### 4.4 Create JSON Key
1. Find your service account in the list
2. Click the **Actions** menu (three dots)
3. Select **"Manage keys"**
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. **Important**: Download and securely save the JSON file
   - This file contains sensitive credentials
   - Cannot be re-downloaded

## Step 5: Security Configuration

### 5.1 Download Location
- Save the JSON file as: `gcp-service-account.json`
- Place it in your project root: `/home/hasbi/affiliate/gcp-service-account.json`

### 5.2 Add to .gitignore
```bash
# Add this line to your .gitignore file
gcp-service-account.json
```

### 5.3 Environment Variables
Update your `.env` file:
```env
# Google Cloud Platform Storage
GCP_PROJECT_ID=youvit-affiliate-storage
GCP_STORAGE_BUCKET_NAME=youvit-affiliate-images
GCP_KEY_FILE_PATH=./gcp-service-account.json
```

## Step 6: Test Configuration

### 6.1 Restart Application
```bash
# Stop your development server and restart
npm run dev
```

### 6.2 Test Upload
1. Navigate to A/B Testing → New Experiment
2. Add an image to a variant
3. Check console for success message:
   ```
   [Upload] Successfully uploaded to: https://storage.googleapis.com/youvit-affiliate-images/ab-testing/[filename]
   ```

### 6.3 Verify in GCP Console
1. Go to Cloud Storage → Buckets → youvit-affiliate-images
2. Look for `ab-testing/` folder with uploaded images
3. Click on an image to get its public URL

## Troubleshooting

### Common Issues

#### 1. "Bucket name already exists"
- Bucket names must be globally unique
- Try: `youvit-affiliate-images-[random-number]`

#### 2. "Access denied" errors
- Verify service account has Storage Admin role
- Check that JSON key file path is correct
- Ensure bucket permissions include `allUsers` with Storage Object Viewer

#### 3. "API not enabled" errors
- Go to APIs & Services → Library
- Search and enable "Cloud Storage API"

#### 4. Public access warnings
- This is expected - images need to be publicly accessible
- Ensure "Public access prevention" is OFF for the bucket

### Verification Commands

Test bucket access:
```bash
# Check if bucket is publicly readable
curl -I https://storage.googleapis.com/youvit-affiliate-images/

# Should return 200 OK or 404 (not 403 Forbidden)
```

## Cost Considerations

### Storage Pricing (as of 2024)
- **Storage**: ~$0.020 per GB per month (Standard class, Asia region)
- **Operations**: $0.05 per 10,000 operations
- **Network egress**: $0.12 per GB (to internet)

### Estimated Monthly Costs
- **100 images (~500MB)**: ~$0.01/month storage
- **1,000 image views**: ~$0.12 bandwidth
- **Total for typical usage**: <$5/month

## Next Steps

1. ✅ Complete GCP setup following this guide
2. ✅ Test image upload functionality
3. 🔄 Implement OAuth integration (next phase)
4. 🔄 Set up monitoring and alerts
5. 🔄 Configure backup and disaster recovery

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check GCP console for error messages
4. Review application logs for detailed error information

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Author**: Affiliate Platform Development Team