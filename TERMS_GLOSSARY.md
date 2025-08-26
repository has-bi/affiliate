# Terms Glossary

## Batch

**Definition**: A group of messages or operations processed together as a single unit, typically used for efficient bulk processing and rate limiting.

**Context**: In this affiliate marketing system, batches are primarily used in A/B testing experiments to send messages to recipients in controlled groups.

**Key Characteristics**:
- **Batch Size**: Number of messages processed in each batch (default: 50)
- **Sequential Processing**: Batches are sent one after another with controlled timing
- **Rate Control**: Helps manage sending rates to avoid overwhelming systems or triggering spam filters

**Examples**:
- An A/B testing experiment with 1000 recipients and batch size of 50 will send 20 batches
- Each batch contains up to 50 message recipients
- Batches are tracked with unique batch numbers for monitoring

**Database Schema**: 
- `ab_batches` table tracks each batch with `batch_number`, `recipient_count`, `success_count`, `failed_count`
- `batch_size` field in experiments controls how many messages per batch

**Usage in Code**:
```javascript
// Send next batch in A/B testing
await sendNextBatch(experiment);

// Configure batch size
batchSize: 50  // Process 50 messages at once
```

## Cooldown

**Definition**: A mandatory waiting period between operations, used as a rate limiting mechanism to prevent system overload and maintain compliance with service limits.

**Context**: In this system, cooldown periods are enforced between message batches to ensure responsible sending practices and avoid triggering rate limits or spam detection.

**Key Characteristics**:
- **Duration**: Time to wait between batches (default: 5 minutes)
- **Rate Limiting**: Prevents too frequent sending that could trigger blocks
- **Automatic Enforcement**: System automatically tracks and enforces cooldown periods
- **Compliance**: Helps maintain good sender reputation with messaging services

**Examples**:
- After sending a batch of 50 messages, system waits 5 minutes before sending next batch
- If rate limit is exceeded, a 5-minute cooldown is automatically applied
- Cooldown periods can be configured per experiment (minimum 1 minute)

**Database Schema**:
- `cooldown_minutes` field in experiments sets the waiting time
- `next_batch_allowed_at` timestamp tracks when next batch can be sent
- `cooldown_until` field in rate limiting table enforces cooldown periods

**Usage in Code**:
```javascript
// Configure cooldown period
cooldownMinutes: 5  // Wait 5 minutes between batches

// Check cooldown status
if (rateLimit?.cooldownUntil && rateLimit.cooldownUntil > now) {
  // Still in cooldown period
}

// Set next batch allowed time
nextBatchAllowedAt: new Date(Date.now() + experiment.cooldownMinutes * 60 * 1000)
```

**Benefits**:
- Prevents service rate limit violations
- Maintains sender reputation
- Reduces risk of messages being marked as spam
- Allows for better system resource management
- Provides breathing room for recipient systems to process messages