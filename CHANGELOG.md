# Changelog

## [Unreleased] - 2025-09-02

### ✨ Added
- **Image Broadcast Feature**: Complete implementation of WhatsApp image broadcasting
  - ImageUploader component for drag-and-drop image uploads
  - GCP Cloud Storage integration for secure image hosting
  - WAHA API integration for sending images with captions
  - Support for multiple image formats (JPG, PNG, GIF, WebP)

- **A/B Testing Enhancements**: 
  - ABRecipientInput component for CSV upload and recipient management
  - Image support in A/B testing experiments
  - Enhanced recipient validation and parsing

- **Broadcast System Improvements**:
  - useBroadcast hook for managing broadcast state
  - Enhanced BroadcastForm with image upload capability
  - Updated bulk message API to handle image attachments

### 🔧 Updated
- **API Routes**:
  - `/api/messages/bulk` - Added image broadcast support
  - `/api/messages/upload-image` - Enhanced image upload handling
  - A/B testing execute endpoint - Added image support

- **Security Enhancements**:
  - Updated .gitignore to protect GCP service account credentials
  - Implemented proper file permissions for sensitive files
  - Added API middleware bypass for message endpoints

- **Dependencies**:
  - Added `@google-cloud/storage@7.17.0` for GCP integration
  - Added `dotenv@17.2.1` for environment management

### 🐛 Fixed
- WAHA client sendImage method now properly formats API requests
- Fixed uniform bucket access compatibility for GCP storage
- Resolved middleware blocking issues for API endpoints

### 🧪 Testing
- Comprehensive image upload and broadcast testing
- Live WhatsApp message delivery verification
- GCP storage security and accessibility validation
- WAHA API integration testing

### 📁 New Files
- `src/hooks/useBroadcast.js` - Broadcast management hook
- `src/lib/gcp-storage.js` - GCP Cloud Storage service
- `src/components/molecules/ABRecipientInput/` - A/B testing recipient input
- `docs/GCP_SETUP_GUIDE.md` - GCP configuration documentation

### 🔐 Security
- Service account JSON files properly secured with 600 permissions
- All sensitive credentials excluded from version control
- GCP storage configured with appropriate access controls
- Environment variables properly managed

### 🎯 Tested Features
- ✅ Image upload to GCP Cloud Storage
- ✅ WhatsApp image broadcast with captions  
- ✅ A/B testing with image variants
- ✅ WAHA API integration (Status: WORKING)
- ✅ Live message delivery to phone number 082284477640

---

### Migration Notes
- Ensure GCP service account JSON is placed in project root with proper permissions
- Configure environment variables: `GCP_PROJECT_ID`, `GCP_STORAGE_BUCKET_NAME`, `GCP_KEY_FILE_PATH`
- Verify WAHA session is active before broadcasting

### Breaking Changes
None - All changes are backward compatible.