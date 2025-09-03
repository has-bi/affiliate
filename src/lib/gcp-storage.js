// src/lib/gcp-storage.js
import { Storage } from '@google-cloud/storage';

class GCPStorageService {
  constructor() {
    // Initialize storage client
    const storageConfig = {
      projectId: process.env.GCP_PROJECT_ID,
    };
    
    // Use credentials from environment variable if available (for production)
    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      try {
        storageConfig.credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
        console.log('[GCP Storage] Using credentials from GCP_SERVICE_ACCOUNT_KEY');
      } catch (error) {
        console.error('[GCP Storage] Failed to parse GCP_SERVICE_ACCOUNT_KEY:', error.message);
        throw new Error('Invalid GCP_SERVICE_ACCOUNT_KEY format');
      }
    } else if (process.env.GCP_KEY_FILE_PATH) {
      // Fallback to key file path (for development)
      storageConfig.keyFilename = process.env.GCP_KEY_FILE_PATH;
      console.log('[GCP Storage] Using key file from GCP_KEY_FILE_PATH');
    } else {
      console.error('[GCP Storage] No GCP credentials found. Set either GCP_SERVICE_ACCOUNT_KEY or GCP_KEY_FILE_PATH');
    }
    
    this.storage = new Storage(storageConfig);
    
    this.bucketName = process.env.GCP_STORAGE_BUCKET_NAME;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Upload file to GCP Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Desired file name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Create file reference in bucket
      const file = this.bucket.file(`ab-testing/${uniqueFileName}`);
      
      // Upload file with metadata (compatible with uniform bucket access)
      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
        resumable: false, // Use simple upload for small files
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('GCP Upload Error:', error);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            // For uniform bucket access, files are public if bucket allows it
            // No need to call makePublic() - it will fail with uniform access
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/ab-testing/${uniqueFileName}`;
            console.log(`[GCP Storage] File uploaded successfully: ${publicUrl}`);
            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        });

        // Write buffer to stream
        stream.end(fileBuffer);
      });
    } catch (error) {
      console.error('GCP Storage upload failed:', error);
      throw new Error(`Failed to upload file to GCP Storage: ${error.message}`);
    }
  }

  /**
   * Delete file from GCP Storage
   * @param {string} fileUrl - Public URL of the file to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileUrl) {
    try {
      // Extract filename from URL
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const file = this.bucket.file(`ab-testing/${fileName}`);
      await file.delete();
      
      console.log(`[GCP Storage] File deleted successfully: ${fileName}`);
      return true;
    } catch (error) {
      console.error('GCP Storage delete failed:', error);
      return false;
    }
  }

  /**
   * Check if file exists in bucket
   * @param {string} fileUrl - Public URL of the file
   * @returns {Promise<boolean>} - File existence status
   */
  async fileExists(fileUrl) {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) return false;

      const file = this.bucket.file(`ab-testing/${fileName}`);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('GCP Storage existence check failed:', error);
      return false;
    }
  }

  /**
   * Extract filename from GCP Storage public URL
   * @param {string} fileUrl - Public URL
   * @returns {string} - Extracted filename
   */
  extractFileNameFromUrl(fileUrl) {
    try {
      const match = fileUrl.match(/ab-testing\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get signed URL for temporary private access
   * @param {string} fileUrl - Public URL of the file
   * @param {number} expirationMinutes - Expiration time in minutes (default: 60)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(fileUrl, expirationMinutes = 60) {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const file = this.bucket.file(`ab-testing/${fileName}`);
      
      const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + (expirationMinutes * 60 * 1000),
      };

      const [url] = await file.getSignedUrl(options);
      return url;
    } catch (error) {
      console.error('GCP Storage signed URL generation failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const gcpStorageInstance = new GCPStorageService();

// Export singleton instance
export default gcpStorageInstance;