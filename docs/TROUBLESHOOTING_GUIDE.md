# A/B Testing Image Troubleshooting Guide

## Overview
This guide helps diagnose and resolve common issues with image uploads and sending in the A/B Testing platform.

## Quick Diagnosis Checklist

Before diving into detailed troubleshooting, run through this quick checklist:

- [ ] GCP Storage is properly configured
- [ ] Environment variables are set correctly
- [ ] WhatsApp session is active and connected
- [ ] Images are in supported formats (JPG, PNG, GIF, WebP)
- [ ] Image file sizes are under 10MB
- [ ] Internet connection is stable

## Common Issues and Solutions

### 1. Image Upload Issues

#### Issue: "Failed to upload image to GCP"
**Symptoms:**
```
Error uploading image to GCP: Failed to upload file to GCP Storage: [detailed error]
```

**Diagnosis Steps:**
1. Check GCP service account configuration
2. Verify bucket permissions
3. Confirm API is enabled

**Solutions:**
```bash
# 1. Verify service account file exists
ls -la gcp-service-account.json

# 2. Check environment variables
grep GCP .env

# 3. Test GCP connectivity
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://storage.googleapis.com/storage/v1/b/youvit-affiliate-images"
```

#### Issue: "Invalid file format"
**Symptoms:**
```
File must be an image
```

**Solutions:**
- Ensure file has proper extension (.jpg, .png, .gif, .webp)
- Check file MIME type is image/*
- Re-save image in supported format

#### Issue: "File size too large"
**Symptoms:**
```
File size must be less than 10MB
```

**Solutions:**
- Compress image using online tools
- Reduce image dimensions
- Convert to more efficient format (WebP, JPEG)

### 2. Image Sending Issues

#### Issue: Images don't send via WhatsApp
**Symptoms:**
- Text messages send successfully
- Images fail to appear in WhatsApp
- Console shows image sending attempts

**Debug Steps:**
1. Check console logs for WAHA responses
2. Verify image URLs are accessible
3. Test image URLs manually

**Console Log Examples:**
```javascript
// Success
[WAHA] Success response: { id: "message_123", status: "sent" }

// Failure
[WAHA] Error response (404): { message: "File not found" }
[WAHA] Error response (500): { message: "Invalid URL" }
```

**Solutions:**
```bash
# 1. Test image URL accessibility
curl -I "https://storage.googleapis.com/youvit-affiliate-images/ab-testing/image.jpg"
# Should return: HTTP/1.1 200 OK

# 2. Check bucket permissions
# Go to GCP Console → Storage → Bucket → Permissions
# Ensure "allUsers" has "Storage Object Viewer" role

# 3. Verify WAHA session status
curl -H "X-Api-Key: YOUR_API_KEY" \
  "https://your-waha-url.com/api/sessions/youvit"
```

#### Issue: "WAHA session not connected"
**Symptoms:**
```
WhatsApp session 'youvit' is not connected (DISCONNECTED)
```

**Solutions:**
1. **Reconnect WhatsApp Session:**
   ```bash
   # Via WAHA API
   curl -X POST "https://your-waha-url.com/api/sessions/youvit/start" \
     -H "X-Api-Key: YOUR_API_KEY"
   ```

2. **Check Session Status:**
   ```bash
   curl -H "X-Api-Key: YOUR_API_KEY" \
     "https://your-waha-url.com/api/sessions/youvit"
   ```

3. **Restart Session if needed:**
   ```bash
   curl -X POST "https://your-waha-url.com/api/sessions/youvit/restart" \
     -H "X-Api-Key: YOUR_API_KEY"
   ```

### 3. GCP Configuration Issues

#### Issue: "Project not found" or "Access denied"
**Symptoms:**
```
GCP Storage upload failed: The project 'youvit-affiliate-storage' does not exist
```

**Diagnosis:**
1. Verify GCP project exists and is active
2. Check service account has correct permissions
3. Confirm project ID matches environment variables

**Solutions:**
```bash
# 1. List your GCP projects
gcloud projects list

# 2. Set the correct project
gcloud config set project youvit-affiliate-storage

# 3. Verify service account
gcloud iam service-accounts list

# 4. Check bucket exists
gsutil ls gs://youvit-affiliate-images
```

#### Issue: Bucket permission denied
**Symptoms:**
```
403 Forbidden: Access denied to bucket
```

**Solutions:**
1. **Check Service Account Roles:**
   - Go to GCP Console → IAM & Admin → IAM
   - Find your service account
   - Ensure it has "Storage Admin" or "Storage Object Admin" role

2. **Verify Bucket Permissions:**
   - Go to Storage → Buckets → youvit-affiliate-images → Permissions
   - Service account should have appropriate access
   - "allUsers" should have "Storage Object Viewer" for public access

### 4. Environment Configuration Issues

#### Issue: Missing environment variables
**Symptoms:**
```
Cannot read properties of undefined (reading 'bucket')
```

**Check Configuration:**
```bash
# Verify all required variables are set
echo "Project ID: $GCP_PROJECT_ID"
echo "Bucket Name: $GCP_STORAGE_BUCKET_NAME"  
echo "Key File: $GCP_KEY_FILE_PATH"

# Check .env file
cat .env | grep GCP
```

**Required Variables:**
```env
GCP_PROJECT_ID=youvit-affiliate-storage
GCP_STORAGE_BUCKET_NAME=youvit-affiliate-images
GCP_KEY_FILE_PATH=./gcp-service-account.json
```

### 5. Network and Connectivity Issues

#### Issue: Timeout errors during upload
**Symptoms:**
```
Error: Request timeout
Connection reset by peer
```

**Solutions:**
1. **Check Internet Connection:**
   ```bash
   ping storage.googleapis.com
   curl -I https://storage.googleapis.com
   ```

2. **Verify Firewall Settings:**
   - Ensure outbound HTTPS (443) is allowed
   - Check for proxy configurations

3. **Test with Smaller Files:**
   - Try uploading smaller images first
   - Gradually increase file size to find limits

### 6. A/B Testing Execution Issues

#### Issue: Campaign starts but no messages sent
**Symptoms:**
- Campaign status shows "active"
- No messages appear in Recent Activity
- Recipients remain in "assigned" status

**Debug Steps:**
```javascript
// Check console logs for:
[A/B Testing] Starting experiment 5
[A/B Testing] Variant A - imageUrl: [url], messageType: [type]
[WAHA] Sending image to [phone]: [payload]
```

**Solutions:**
1. **Check Experiment Configuration:**
   - Ensure variants have content (text or image)
   - Verify recipients are properly assigned
   - Confirm session name matches WAHA

2. **Manual Batch Trigger:**
   - Go to experiment detail page
   - Click "Send Next Batch" manually

## Diagnostic Tools and Commands

### 1. Environment Validation Script
Create a file `debug-env.js`:
```javascript
// debug-env.js
console.log('Environment Check:');
console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
console.log('GCP_STORAGE_BUCKET_NAME:', process.env.GCP_STORAGE_BUCKET_NAME);
console.log('GCP_KEY_FILE_PATH:', process.env.GCP_KEY_FILE_PATH);
console.log('WAHA_API_URL:', process.env.NEXT_PUBLIC_WAHA_API_URL);

// Check if service account file exists
const fs = require('fs');
const keyPath = process.env.GCP_KEY_FILE_PATH;
console.log('Service account file exists:', fs.existsSync(keyPath));
```

Run with: `node debug-env.js`

### 2. GCP Connectivity Test
```bash
#!/bin/bash
# test-gcp.sh

echo "Testing GCP connectivity..."

# Test bucket access
echo "Testing bucket access:"
curl -I "https://storage.googleapis.com/youvit-affiliate-images/" 2>/dev/null | head -1

# Test authentication
echo "Testing authentication:"
gcloud auth list

# Test bucket listing
echo "Testing bucket contents:"
gsutil ls gs://youvit-affiliate-images/ab-testing/ | head -5
```

### 3. WAHA API Test Script
```bash
#!/bin/bash
# test-waha.sh

WAHA_URL="https://your-waha-url.com"
API_KEY="your-api-key"

echo "Testing WAHA connectivity..."

# Test sessions endpoint
echo "Sessions:"
curl -s -H "X-Api-Key: $API_KEY" "$WAHA_URL/api/sessions" | jq '.[0].status'

# Test specific session
echo "Session status:"
curl -s -H "X-Api-Key: $API_KEY" "$WAHA_URL/api/sessions/youvit" | jq '.status'
```

## Performance Monitoring

### Key Metrics to Monitor
1. **Upload Success Rate**: Percentage of successful image uploads
2. **Send Success Rate**: Percentage of successful message sends
3. **Response Times**: Time taken for uploads and sends
4. **Error Rates**: Frequency of different error types

### Monitoring Commands
```bash
# Check recent upload logs
grep "Successfully uploaded" /var/log/app.log | tail -10

# Monitor WAHA success rate
grep "WAHA.*Success" /var/log/app.log | wc -l
grep "WAHA.*Error" /var/log/app.log | wc -l

# Check GCP storage usage
gsutil du -s gs://youvit-affiliate-images/
```

## Emergency Procedures

### 1. System Down Scenario
If the entire system stops working:

1. **Check Core Services:**
   ```bash
   # Database connection
   npm run db:check
   
   # WAHA API status
   curl -I https://your-waha-url.com/api/health
   
   # GCP connectivity
   gcloud info
   ```

2. **Restart Application:**
   ```bash
   # Stop application
   pkill -f "npm run dev"
   
   # Clear cache
   rm -rf .next
   
   # Restart
   npm run dev
   ```

### 2. Data Recovery
If images are lost or corrupted:

1. **Check GCP Storage:**
   ```bash
   gsutil ls gs://youvit-affiliate-images/ab-testing/
   ```

2. **Restore from Backup** (if configured):
   ```bash
   gsutil cp gs://youvit-affiliate-images-backup/* gs://youvit-affiliate-images/ab-testing/
   ```

## Getting Help

### 1. Log Collection
Before contacting support, collect these logs:
```bash
# Application logs
tail -100 /var/log/app.log > debug-app.log

# System logs
journalctl -u your-app-service -n 100 > debug-system.log

# Environment info
env | grep -E "(GCP|WAHA|DATABASE)" > debug-env.log
```

### 2. Issue Report Template
```
**Issue**: Brief description
**Environment**: Development/Production
**Timestamp**: When the issue occurred
**Error Messages**: Exact error messages
**Steps to Reproduce**: 
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: What should happen
**Actual Behavior**: What actually happened
**Logs**: Attach relevant log files
**Screenshots**: If applicable
```

### 3. Support Contacts
- **Technical Issues**: Development team
- **GCP Issues**: Cloud platform administrator  
- **WAHA Issues**: WhatsApp API provider
- **Critical Issues**: Emergency escalation process

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Emergency Contact**: [Your emergency contact information]