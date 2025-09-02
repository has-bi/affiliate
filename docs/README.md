# Affiliate A/B Testing Platform - Image Documentation

## Overview
This documentation covers the image storage and A/B testing features of the Affiliate Platform. The system uses Google Cloud Platform (GCP) Storage for secure, scalable image management.

## Documentation Structure

### 📋 **Setup Guides**
- **[GCP Setup Guide](./GCP_SETUP_GUIDE.md)** - Complete setup instructions for Google Cloud Platform
- **[Image Storage Architecture](./IMAGE_STORAGE_ARCHITECTURE.md)** - Technical architecture documentation
- **[A/B Testing Image Guide](./A_B_TESTING_IMAGE_GUIDE.md)** - User guide for creating campaigns with images
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

## Quick Start

### 🚀 **For Developers**
1. Read the [GCP Setup Guide](./GCP_SETUP_GUIDE.md) to configure Google Cloud Storage
2. Follow the [Image Storage Architecture](./IMAGE_STORAGE_ARCHITECTURE.md) to understand the technical implementation
3. Use the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) when issues arise

### 👤 **For Users**
1. Start with the [A/B Testing Image Guide](./A_B_TESTING_IMAGE_GUIDE.md) to learn how to create campaigns with images
2. Refer to the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) if you encounter issues

## Features Overview

### ✨ **Image Upload & Storage**
- **Multiple upload methods**: File upload or URL input
- **Format support**: JPG, PNG, GIF, WebP
- **Cloud storage**: Secure Google Cloud Platform integration
- **Global CDN**: Fast image delivery worldwide
- **Automatic optimization**: Proper caching and compression headers

### 📊 **A/B Testing with Images**
- **Visual variants**: Test different images against each other
- **Mixed content**: Combine text and images in campaigns
- **Performance tracking**: Monitor engagement and conversion rates
- **Recipient management**: Manual input or CSV upload options

### 🔒 **Security & Reliability**
- **Secure uploads**: Authenticated file uploads to GCP
- **Public delivery**: Images accessible to WAHA/WhatsApp without auth
- **Backup & recovery**: Built-in GCP redundancy
- **Access control**: Role-based permissions

## Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Upload   │───▶│   API Process   │───▶│  GCP Storage    │
│   (Frontend)    │    │   (Backend)     │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   WhatsApp      │
                       │ (URL Storage)   │    │ (WAHA/Delivery) │
                       └─────────────────┘    └─────────────────┘
```

## Key Technologies

- **Frontend**: Next.js React components with drag & drop upload
- **Backend**: Node.js API routes with GCP SDK integration
- **Storage**: Google Cloud Storage with CDN
- **Database**: PostgreSQL with Prisma ORM
- **WhatsApp**: WAHA API for message delivery
- **Authentication**: Cookie-based session management

## Environment Variables

```env
# Google Cloud Platform Storage
GCP_PROJECT_ID=youvit-affiliate-storage
GCP_STORAGE_BUCKET_NAME=youvit-affiliate-images
GCP_KEY_FILE_PATH=./gcp-service-account.json

# WhatsApp API (WAHA)
NEXT_PUBLIC_WAHA_API_URL=https://your-waha-url.com
NEXT_PUBLIC_WAHA_API_KEY=your-api-key
NEXT_PUBLIC_WAHA_SESSION=youvit

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your-postgres-connection-string
```

## Getting Started Checklist

### 🎯 **Prerequisites**
- [ ] Google Cloud Platform account
- [ ] WAHA WhatsApp API access
- [ ] PostgreSQL database
- [ ] Node.js 18+ installed

### ⚙️ **Setup Steps**
1. [ ] Complete [GCP Setup Guide](./GCP_SETUP_GUIDE.md)
2. [ ] Install dependencies: `npm install @google-cloud/storage`
3. [ ] Configure environment variables in `.env`
4. [ ] Place service account JSON key in project root
5. [ ] Test upload functionality
6. [ ] Create first A/B test campaign with images

### ✅ **Verification**
- [ ] Images upload successfully to GCP
- [ ] Public URLs are accessible without authentication
- [ ] WAHA can download and send images via WhatsApp
- [ ] A/B test campaigns execute properly
- [ ] Performance metrics are tracked

## Support and Maintenance

### 📞 **Getting Help**
- **Documentation Issues**: Check each guide for specific topics
- **Technical Problems**: Use the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- **Feature Requests**: Contact the development team
- **Emergency Issues**: Follow emergency procedures in troubleshooting guide

### 🔄 **Regular Maintenance**
- Monitor GCP storage usage and costs
- Review image upload performance metrics
- Clean up old campaign images periodically
- Update service account keys annually
- Review and update documentation as needed

### 📈 **Performance Monitoring**
- Track upload success rates
- Monitor image delivery performance
- Review A/B test engagement metrics  
- Analyze storage costs and optimization opportunities

## Version History

### v1.0 (September 2025)
- ✅ Initial GCP Cloud Storage integration
- ✅ Image upload API implementation
- ✅ A/B testing with image support
- ✅ WAHA WhatsApp integration
- ✅ Complete documentation suite

### Planned Features (v1.1)
- 🔄 OAuth 2.0 integration with GCP
- 🔄 Image optimization and compression
- 🔄 Advanced analytics dashboard
- 🔄 Bulk image management tools
- 🔄 Automated testing and deployment

## Contributing

When updating this documentation:

1. **Keep guides current**: Update screenshots and steps when UI changes
2. **Test procedures**: Verify all setup steps work with latest versions
3. **Update examples**: Ensure code examples match current implementation
4. **Version documentation**: Note changes in version history
5. **Cross-reference**: Link related sections between documents

## License and Security

- **Confidential**: This documentation contains sensitive setup information
- **Internal Use**: Not for distribution outside the organization
- **Security**: Keep service account keys and API keys secure
- **Compliance**: Follow company data protection policies

---

**Last Updated**: September 2025  
**Documentation Version**: 1.0  
**Platform Version**: Compatible with Node.js 18+, Next.js 14+  
**Maintained By**: Affiliate Platform Development Team