# MLM Scheduled Jobs Setup Guide

## Overview
This system includes comprehensive scheduled jobs for MLM maintenance, including weekly payouts, monthly eligibility sweeps, tree health checks, and commission reconciliation.

## Jobs Included

### 1. Weekly Self-Payout Job
- **Schedule**: Every Monday at 6:00 AM
- **Function**: Processes scheduled self-payouts for eligible users
- **Features**: 
  - Batch processing (50 users at a time)
  - Automatic retry for failed payments
  - Email notifications
  - Audit logging

### 2. Monthly Eligibility Sweep
- **Schedule**: 1st of every month at 2:00 AM
- **Function**: Checks users' monthly purchase requirements and KYC status
- **Features**:
  - 3-3 rule validation
  - Commission rollup for ineligible users
  - Monthly purchase counter reset
  - Eligibility history tracking

### 3. Tree Health Check
- **Schedule**: Daily at 3:00 AM
- **Function**: Verifies MLM tree structure integrity
- **Features**:
  - Orphaned user detection
  - Hierarchy consistency validation
  - Matrix placement verification
  - Automatic fixes for minor issues

### 4. Commission Reconciliation
- **Schedule**: Daily at 4:00 AM
- **Function**: Verifies ledger entries match wallet balances
- **Features**:
  - Wallet balance verification
  - Commission calculation checks
  - Automatic minor corrections (up to ₹1)
  - Discrepancy reporting

## Installation & Setup

### 1. Install Dependencies
```bash
npm install node-cron
```

### 2. Environment Variables
Add to your `.env` file:
```bash
# Job Scheduler Configuration
ENABLE_SCHEDULED_JOBS=true
TIMEZONE=Asia/Kolkata
ADMIN_EMAIL=admin@wearandearn.com

# Email Configuration (replace with your service)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_EMAIL=noreply@wearandearn.com
```

### 3. Enable Jobs in Production
In your main application file (app.js or similar):
```javascript
import mlmScheduler from '@/lib/jobs/scheduler'

// Initialize scheduler in production
if (process.env.NODE_ENV === 'production') {
  mlmScheduler.initialize()
}
```

### 4. For Vercel Deployment
Create `vercel.json` with cron jobs:
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-payouts",
      "schedule": "0 6 * * 1"
    },
    {
      "path": "/api/cron/monthly-sweep",
      "schedule": "0 2 1 * *"
    },
    {
      "path": "/api/cron/tree-health",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/reconciliation",
      "schedule": "0 4 * * *"
    }
  ]
}
```

Create corresponding API endpoints in `/app/api/cron/`:

**`/app/api/cron/weekly-payouts/route.js`**:
```javascript
import { processWeeklyPayouts } from '@/lib/jobs/weekly-payouts'

export async function GET() {
  try {
    const result = await processWeeklyPayouts()
    return Response.json({ success: true, result })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

## Database Schema Updates Required

Add these tables to your Prisma schema:

```prisma
model JobLog {
  id        Int      @id @default(autoincrement())
  jobId     String   @unique
  jobType   String
  status    String   // 'success', 'failed', 'warning'
  startTime DateTime
  endTime   DateTime
  duration  Int      // milliseconds
  error     String?
  metadata  Json?
  createdAt DateTime @default(now())
}

model SelfPayoutSchedule {
  id             Int       @id @default(autoincrement())
  userId         Int
  amount         Float
  payoutDate     DateTime
  status         String    @default("pending") // 'pending', 'paid', 'failed', 'permanently_failed'
  description    String?
  processedAt    DateTime?
  actualAmount   Float?
  failureReason  String?
  retryCount     Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([payoutDate, status])
}

model PayoutHistory {
  id          Int      @id @default(autoincrement())
  userId      Int
  amount      Float
  type        String   // 'self_payout', 'commission', 'bonus'
  status      String   // 'completed', 'failed', 'cancelled'
  description String?
  metadata    Json?
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

model CommissionRollup {
  id               Int     @id @default(autoincrement())
  userId           Int
  month            Int
  year             Int
  rolledUpAmount   Float
  commissionCount  Int
  reason           String
  eligibilityCheck Json?
  jobId            String?
  createdAt        DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, month, year])
}

model EligibilityLog {
  id              Int     @id @default(autoincrement())
  userId          Int
  month           Int
  year            Int
  isEligible      Boolean
  monthlyPurchase Float
  requiredPurchase Float
  kycApproved     Boolean
  rolledUpAmount  Float   @default(0)
  jobId           String?
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([month, year])
  @@index([userId, month, year])
}

model MonthlyStats {
  id                   Int     @id @default(autoincrement())
  month                Int
  year                 Int
  monthYear            String  @unique
  eligibleUsers        Int
  ineligibleUsers      Int
  totalRolledUpAmount  Float
  lastUpdated          DateTime @default(now())
  jobId                String?
  
  @@index([year, month])
}

model TreeHealthReport {
  id           Int      @id @default(autoincrement())
  jobId        String   @unique
  healthScore  Int
  issuesFound  Int
  issuesFixed  Int
  reportData   Json
  createdAt    DateTime @default(now())
  
  @@index([createdAt])
}

model ReconciliationReport {
  id                    Int     @id @default(autoincrement())
  jobId                 String  @unique
  usersChecked          Int
  discrepanciesFound    Int
  autoCorrections       Int
  totalDiscrepancyAmount Float
  accuracy              Float
  reportData            Json
  createdAt             DateTime @default(now())
  
  @@index([createdAt])
}

// Add these fields to existing User model
model User {
  // ... existing fields ...
  
  lastEligibilityCheck    DateTime?
  eligibilityHistory      Json?
  
  // Relations
  selfPayoutSchedules     SelfPayoutSchedule[]
  payoutHistory          PayoutHistory[]
  commissionRollups      CommissionRollup[]
  eligibilityLogs        EligibilityLog[]
}
```

## API Endpoints for Job Management

### Get Job Status
```http
GET /api/admin/jobs?action=status&job=weekly-payouts
```

### Trigger Job Manually
```http
POST /api/admin/jobs
Content-Type: application/json

{
  "action": "trigger",
  "jobName": "weekly-payouts"
}
```

### Enable/Disable Job
```http
POST /api/admin/jobs
Content-Type: application/json

{
  "action": "toggle",
  "jobName": "tree-health-check",
  "enable": false
}
```

### Get Job History
```http
GET /api/admin/jobs?action=history&job=reconciliation&limit=50
```

## Monitoring & Alerts

### Job Status Dashboard
Access job status at: `/api/admin/jobs`

### Email Notifications
- Job failures are automatically emailed to admin
- Daily status reports for any failures
- Weekly summary reports
- Health alerts for critical issues

### Logging
All job executions are logged with:
- Execution time
- Success/failure status
- Error details
- Performance metrics

## Best Practices

1. **Monitor Job Performance**: Check execution times and success rates regularly
2. **Handle Failures**: Set up proper alerting for job failures
3. **Data Backup**: Ensure database backups before major operations
4. **Test in Staging**: Always test job changes in staging environment
5. **Gradual Rollout**: Deploy job changes gradually to production

## Troubleshooting

### Common Issues

1. **Jobs Not Running**
   - Check `ENABLE_SCHEDULED_JOBS=true` in environment
   - Verify timezone configuration
   - Check server logs for scheduler initialization

2. **Email Notifications Failing**
   - Verify email service configuration
   - Check SMTP credentials
   - Test email service separately

3. **Database Errors**
   - Ensure all required tables exist
   - Check database connection
   - Verify user permissions

4. **Performance Issues**
   - Monitor batch sizes for large datasets
   - Add database indexes for queries
   - Consider job execution timing

### Debug Commands

```javascript
// Check scheduler status
console.log(mlmScheduler.getJobStatus())

// View recent job history
console.log(mlmScheduler.getJobHistory())

// Manually trigger a job
await mlmScheduler.triggerJob('weekly-payouts')
```

## Security Considerations

1. **Admin Access**: Only admins can manage jobs
2. **Rate Limiting**: Jobs include built-in rate limiting
3. **Audit Logging**: All job actions are logged
4. **Data Validation**: Input validation on all operations
5. **Error Handling**: Graceful error handling prevents data corruption

## Support

For issues or questions:
1. Check logs in `/api/admin/jobs`
2. Review job history for patterns
3. Monitor system health metrics
4. Contact development team with job IDs for specific issues
