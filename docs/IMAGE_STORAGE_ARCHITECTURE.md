# Image Storage Architecture Documentation

## Overview
This document explains the image storage architecture for the Affiliate A/B Testing platform, covering the implementation, data flow, and technical decisions.

## Architecture Components

### 1. Storage Layer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │  GCP Storage    │
│   (Upload UI)   │───▶│  (Processing)   │───▶│   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   WAHA API      │
                       │ (URL Storage)   │    │ (Image Sending) │
                       └─────────────────┘    └─────────────────┘
```

### 2. Data Flow

#### 2.1 Image Upload Process
1. **User Upload**: User selects image in A/B testing form
2. **Frontend Validation**: File type, size validation
3. **API Processing**: Convert to buffer, generate unique filename
4. **GCP Upload**: Store in Cloud Storage bucket
5. **URL Return**: Return public GCP URL to frontend
6. **Database Storage**: Save URL in variant record

#### 2.2 Image Delivery Process
1. **Campaign Execution**: A/B test starts sending
2. **URL Resolution**: Retrieve image URL from database
3. **WAHA Integration**: Send URL to WAHA API
4. **Image Download**: WAHA downloads from GCP
5. **Message Delivery**: WAHA sends image to WhatsApp

## File Structure

### Directory Organization
```
src/
├── lib/
│   ├── gcp-storage.js              # GCP Storage service
│   └── whatsapp/
│       └── wahaClient.js           # WAHA integration
├── app/
│   └── api/
│       ├── messages/
│       │   └── upload-image/
│       │       └── route.js        # Image upload endpoint
│       └── ab-testing/
│           └── experiments/
│               └── [id]/
│                   └── execute/
│                       └── route.js # A/B test execution
├── components/
│   └── molecules/
│       ├── ImageUploader/
│       │   └── index.js            # Image upload UI
│       └── ABRecipientInput/
│           └── index.js            # Recipient input with images
└── docs/
    ├── GCP_SETUP_GUIDE.md          # Setup instructions
    └── IMAGE_STORAGE_ARCHITECTURE.md # This document
```

## Technical Implementation

### 1. GCP Storage Service (`src/lib/gcp-storage.js`)

#### Class Structure
```javascript
class GCPStorageService {
  constructor()           // Initialize GCP client
  uploadFile()           // Upload file to bucket
  deleteFile()           // Delete file from bucket
  fileExists()           // Check file existence
  getSignedUrl()         // Generate temporary URLs
  extractFileNameFromUrl() // Utility method
}
```

#### Key Features
- **Unique Filenames**: Timestamp-based naming prevents conflicts
- **Public URLs**: Direct access without authentication
- **Error Handling**: Comprehensive error catching and logging
- **File Validation**: Size and type validation
- **Metadata**: Content-Type and cache headers

#### Storage Path Structure
```
youvit-affiliate-images/
└── ab-testing/
    ├── 1756725566656-image1.jpg
    ├── 1756725580595-image2.jpg
    └── ...
```

### 2. Upload API (`src/app/api/messages/upload-image/route.js`)

#### Request Flow
```javascript
POST /api/messages/upload-image
├── Validate file (type, size)
├── Convert to buffer
├── Upload to GCP Storage
└── Return public URL
```

#### Response Format
```json
{
  "url": "https://storage.googleapis.com/youvit-affiliate-images/ab-testing/1756725566656-image.jpg",
  "filename": "original-filename.jpg",
  "size": 216544,
  "type": "image/jpeg",
  "storage": "gcp"
}
```

### 3. A/B Testing Integration

#### URL Resolution Logic
```javascript
// Handle different URL types
if (imageUrl.startsWith('/')) {
  // Legacy local storage URLs
  imageUrl = `${baseUrl}${imageUrl}`;
} else if (imageUrl.includes('storage.googleapis.com')) {
  // GCP Storage URLs (already absolute)
  console.log('Using GCP Storage URL');
} else {
  // External URLs
  console.log('Using external URL');
}
```

#### WAHA Integration
```javascript
// Send image via WAHA API
const payload = {
  session: sessionName,
  chatId: chatId,
  file: {
    mimetype: "image/jpeg",
    url: imageUrl,           // GCP public URL
    filename: "image.jpeg"
  },
  caption: caption
};
```

## Database Schema

### ABVariant Table
```sql
CREATE TABLE ab_variants (
  id              SERIAL PRIMARY KEY,
  experiment_id   INTEGER NOT NULL,
  name            VARCHAR NOT NULL,
  template_id     INTEGER,
  custom_message  TEXT,
  image_url       TEXT,              -- GCP Storage URL
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Template Table
```sql
CREATE TABLE templates (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR NOT NULL,
  description     TEXT,
  content         TEXT NOT NULL,
  image_url       TEXT,              -- GCP Storage URL
  category        VARCHAR DEFAULT 'general',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

### 1. Access Control
- **Service Account**: Limited to Storage Admin role
- **Bucket Permissions**: Public read-only for images
- **Authentication**: Service account JSON key for uploads
- **Network Security**: HTTPS-only access

### 2. Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Access Logging**: GCP audit logs for access tracking
- **Key Management**: Secure storage of service account keys
- **Public Access**: Only images are public, not administrative access

### 3. Best Practices
```javascript
// Environment variables for sensitive data
GCP_PROJECT_ID=youvit-affiliate-storage
GCP_STORAGE_BUCKET_NAME=youvit-affiliate-images
GCP_KEY_FILE_PATH=./gcp-service-account.json

// .gitignore sensitive files
gcp-service-account.json
```

## Performance Optimization

### 1. CDN Benefits
- **Global Distribution**: Images served from nearest edge location
- **Cache Headers**: 1-year cache for static images
- **Bandwidth**: Optimized delivery worldwide
- **Latency**: Reduced load times for global users

### 2. Upload Optimization
```javascript
// Streaming upload for large files
const stream = file.createWriteStream({
  metadata: {
    contentType: mimeType,
    cacheControl: 'public, max-age=31536000', // 1 year cache
  },
  public: true,
  resumable: false, // Simple upload for small files
});
```

### 3. Error Handling
```javascript
try {
  const publicUrl = await gcpStorage.uploadFile(buffer, file.name, file.type);
  console.log(`Successfully uploaded: ${publicUrl}`);
} catch (error) {
  console.error('Upload failed:', error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

## Monitoring and Logging

### 1. Application Logs
```javascript
console.log(`[Upload] Uploading ${file.name} (${file.size} bytes) to GCP Storage`);
console.log(`[A/B Testing] Using GCP Storage URL: ${imageUrl}`);
console.log(`[WAHA] Sending image to ${chatId}: ${JSON.stringify(payload)}`);
```

### 2. GCP Monitoring
- **Storage Metrics**: Usage, requests, errors
- **Access Logs**: Who accessed what and when
- **Cost Tracking**: Storage and bandwidth costs
- **Alerts**: Set up notifications for unusual activity

## Migration Strategy

### From Local Storage to GCP
1. **Phase 1**: Install GCP integration alongside local storage
2. **Phase 2**: Switch new uploads to GCP
3. **Phase 3**: Update URLs in A/B testing execution
4. **Phase 4**: Migrate existing images (optional)

### Backward Compatibility
```javascript
// Support both local and GCP URLs
if (imageUrl.startsWith('/')) {
  // Legacy local storage
  imageUrl = `${baseUrl}${imageUrl}`;
} else if (imageUrl.includes('storage.googleapis.com')) {
  // New GCP storage
  console.log('Using GCP Storage URL');
}
```

## Cost Management

### 1. Storage Classes
- **Standard**: For frequently accessed images (current)
- **Nearline**: For monthly access (future optimization)
- **Coldline**: For yearly access (archive)

### 2. Lifecycle Policies
```javascript
// Future: Automatic archiving of old campaign images
{
  "rule": [{
    "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
    "condition": {"age": 90} // Move to cheaper storage after 90 days
  }]
}
```

### 3. Cost Monitoring
- Set up billing alerts
- Monitor storage usage trends
- Optimize for cost vs. performance

## Future Enhancements

### 1. Image Optimization
- **Compression**: Automatic image optimization
- **Resizing**: Multiple sizes for different use cases
- **Format Conversion**: WebP for better compression

### 2. Advanced Features
- **Image Analytics**: Track image performance
- **A/B Testing**: Test different images
- **CDN Integration**: Advanced caching strategies

### 3. Security Enhancements
- **Signed URLs**: For temporary access
- **Access Policies**: More granular permissions
- **Encryption**: Customer-managed keys

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Maintainer**: Affiliate Platform Development Team