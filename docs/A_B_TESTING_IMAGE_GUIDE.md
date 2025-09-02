# A/B Testing with Images - User Guide

## Overview
This guide explains how to create and manage A/B testing campaigns with images in the Affiliate Platform. Images can significantly improve engagement rates and campaign performance.

## Getting Started

### Prerequisites
- Access to the Affiliate Platform
- Images prepared for testing (JPG, PNG, GIF, WebP)
- Recipient phone numbers or CSV files
- WhatsApp session configured

### Supported Image Formats
- **JPEG/JPG**: Best for photos and complex images
- **PNG**: Best for graphics with transparency
- **GIF**: For animated content
- **WebP**: Modern format with better compression
- **Maximum size**: 10MB per image
- **Recommended size**: 1080x1080px or smaller

## Creating A/B Tests with Images

### Step 1: Create New Experiment
1. Navigate to **A/B Testing** → **New Experiment**
2. Fill in basic information:
   - **Experiment Name**: Descriptive name (e.g., "Product Launch - Image Test")
   - **Description**: Brief explanation of test goals
   - **WhatsApp Session**: Select active session
   - **Batch Size**: Number of messages per batch (default: 50)
   - **Cooldown**: Minutes between batches (default: 5)

### Step 2: Configure Variants

#### Variant A (Control)
1. **Template Selection** (optional):
   - Choose existing template or leave empty
2. **Custom Message**:
   - Enter your text message
   - Can be used as image caption if image is added
3. **Image Upload**:
   - Click **"Manual Input"** or **"CSV Upload"** toggle
   - Select **"Upload File"** or **"Image URL"** tab
   - Upload your image or enter image URL
   - Preview will appear after successful upload
4. **Recipients**:
   - **Manual Input**: Type phone numbers, one per line
   - **CSV Upload**: Upload CSV with Name, Phone Number columns

#### Variant B (Test)
1. Repeat the same process with different content
2. **Testing Options**:
   - Same text, different image
   - Different text, same image
   - Completely different text + image
   - Text-only vs. image + text

### Step 3: Add Recipients

#### Manual Input Method
```
081234567890
082345678901
John Doe, 083456789012
Jane Smith, 084567890123
```

#### CSV Upload Method
```csv
Name,Phone Number
John Doe,081234567890
Jane Smith,082345678901
Alice Johnson,083456789012
```

### Step 4: Review and Launch
1. **Validation**: System checks all variants have content and recipients
2. **Preview**: Review message content and images
3. **Save as Draft**: Save for later editing
4. **Start Immediately**: Launch the campaign immediately

## Image Best Practices

### 1. Image Selection
- **High Quality**: Use clear, high-resolution images
- **Relevant Content**: Images should match your message
- **Brand Consistent**: Maintain brand colors and style
- **Mobile Optimized**: Consider how images look on mobile devices

### 2. Size and Format
- **Aspect Ratio**: Square (1:1) or vertical (4:5) work best on mobile
- **File Size**: Keep under 2MB for faster sending
- **Format**: JPEG for photos, PNG for graphics

### 3. A/B Testing Strategies

#### Image vs. Text Only
- **Variant A**: Text message only
- **Variant B**: Same text + relevant image
- **Hypothesis**: Images increase engagement

#### Different Images
- **Variant A**: Product photo
- **Variant B**: Lifestyle/usage photo
- **Hypothesis**: Context affects conversion

#### Different Styles
- **Variant A**: Professional product shot
- **Variant B**: User-generated content style
- **Hypothesis**: Authenticity drives engagement

## Managing Active Campaigns

### Campaign Dashboard
1. Go to **A/B Testing** → **Active Experiments**
2. Click on experiment name to view details

### Available Actions
- **Send Next Batch**: Manually trigger next batch
- **Pause**: Temporarily stop sending
- **Resume**: Continue paused campaign
- **Stop**: End campaign permanently

### Monitoring Progress
- **Real-time Stats**: Sent, delivered, read, failed counts
- **Variant Performance**: Compare variants side-by-side
- **Recent Activity**: See latest sending activity
- **Progress Bars**: Visual representation of completion

## Troubleshooting

### Common Issues

#### 1. Image Upload Failures
**Symptoms**: Upload fails or returns error
**Solutions**:
- Check file size (must be under 10MB)
- Verify file format (JPG, PNG, GIF, WebP)
- Try uploading a different image
- Check internet connection

#### 2. Images Not Sending
**Symptoms**: Text sends but images don't appear
**Solutions**:
- Verify WhatsApp session is active
- Check if image URL is accessible
- Review console logs for detailed errors
- Try with a different image

#### 3. Slow Sending
**Symptoms**: Messages send very slowly
**Solutions**:
- Increase cooldown time between batches
- Reduce batch size
- Check WhatsApp account limits

### Error Messages

#### "No message content or image found"
- Add either text message or image to variant
- Both variants need some form of content

#### "Images failed to send"
- Check WhatsApp session status
- Verify image URLs are accessible
- Review WAHA API connection

#### "Rate limit exceeded"
- Wait for cooldown period to complete
- Consider reducing sending frequency

## Performance Analytics

### Key Metrics
- **Send Rate**: Successfully sent messages per hour
- **Delivery Rate**: Percentage of messages delivered
- **Read Rate**: Percentage of delivered messages read
- **Engagement**: Click-through rates (if tracking links)

### Comparison Analysis
```
Variant A (Text Only):
├── Sent: 500
├── Delivered: 485 (97%)
├── Read: 320 (66%)
└── Engagement: 12%

Variant B (Text + Image):
├── Sent: 500  
├── Delivered: 490 (98%)
├── Read: 380 (78%)
└── Engagement: 18%

Result: Images increased read rate by 12% and engagement by 6%
```

### Statistical Significance
- Run tests until statistical significance is reached
- Minimum 100 recipients per variant recommended
- Consider external factors (time of day, day of week)

## Advanced Features

### 1. Image URL Input
- Use existing images from web
- CDN-hosted images for better performance
- Dynamic image selection

### 2. Template Integration
- Create reusable message + image templates
- Consistent branding across campaigns
- Quick campaign setup

### 3. Recipient Segmentation
- Different images for different audience segments
- Geographic customization
- Demographic targeting

## Security and Privacy

### Image Storage
- Images stored securely in Google Cloud Storage
- Public URLs for WhatsApp delivery
- Automatic backups and redundancy

### Data Protection
- Phone numbers encrypted in database
- GDPR compliant data handling
- Secure file upload and storage

### Access Control
- User authentication required
- Role-based access to campaigns
- Audit trails for all actions

## Tips for Success

### 1. Test Planning
- Define clear hypotheses before testing
- Plan for sufficient sample sizes
- Consider seasonal and timing factors

### 2. Creative Strategy
- Test one variable at a time for clearer results
- Use emotionally engaging images
- Maintain consistent brand voice

### 3. Technical Optimization
- Optimize images before upload
- Test sending during off-peak hours
- Monitor campaign performance closely

### 4. Results Analysis
- Look beyond open rates to engagement metrics
- Consider qualitative feedback from recipients
- Document learnings for future campaigns

## FAQ

### Q: Can I change images after starting a campaign?
**A**: No, images cannot be changed once a campaign starts. Create a new campaign for different images.

### Q: What's the maximum number of images per campaign?
**A**: Each variant can have one image. You can have multiple variants with different images.

### Q: Do images count against WhatsApp limits?
**A**: Yes, image messages count toward your daily sending limits.

### Q: Can I use animated GIFs?
**A**: Yes, GIF format is supported for animated content.

### Q: How do I track which variant performs better?
**A**: Use the campaign dashboard to compare delivery, read rates, and engagement metrics between variants.

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Support**: Contact development team for technical issues