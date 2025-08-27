import cron from 'node-cron'
import { processWeeklyPayouts, retryFailedPayouts } from './weekly-payouts.js'
import { processMonthlyEligibilitySweep } from './monthly-sweep.js'
import { performTreeHealthCheck } from './tree-maintenance.js'
import { performCommissionReconciliation } from './reconciliation.js'
import { sendEmail } from "@/lib/email"

/**
 * MLM Job Scheduler
 * Coordinates all scheduled maintenance jobs for the MLM system
 */
class MLMJobScheduler {
  constructor() {
    this.jobs = new Map()
    this.isProduction = process.env.NODE_ENV === 'production'
    this.enableJobs = process.env.ENABLE_SCHEDULED_JOBS === 'true'
    this.jobHistory = []
  }

  /**
   * Initialize and start all scheduled jobs
   */
  initialize() {
    if (!this.enableJobs) {
      console.log('Scheduled jobs are disabled. Set ENABLE_SCHEDULED_JOBS=true to enable.')
      return
    }

    console.log('Initializing MLM job scheduler...')

    // Weekly Self-Payout Job - Every Monday at 6:00 AM
    this.scheduleJob('weekly-payouts', '0 6 * * 1', async () => {
      await this.executeJob('weekly-payouts', processWeeklyPayouts)
    })

    // Failed Payout Retry - Every day at 7:00 AM
    this.scheduleJob('retry-failed-payouts', '0 7 * * *', async () => {
      await this.executeJob('retry-failed-payouts', retryFailedPayouts)
    })

    // Monthly Eligibility Sweep - 1st of every month at 2:00 AM
    this.scheduleJob('monthly-eligibility-sweep', '0 2 1 * *', async () => {
      await this.executeJob('monthly-eligibility-sweep', processMonthlyEligibilitySweep)
    })

    // Tree Health Check - Every day at 3:00 AM
    this.scheduleJob('tree-health-check', '0 3 * * *', async () => {
      await this.executeJob('tree-health-check', performTreeHealthCheck)
    })

    // Commission Reconciliation - Every day at 4:00 AM
    this.scheduleJob('commission-reconciliation', '0 4 * * *', async () => {
      await this.executeJob('commission-reconciliation', performCommissionReconciliation)
    })

    // Job Status Report - Every day at 8:00 AM
    this.scheduleJob('daily-status-report', '0 8 * * *', async () => {
      await this.executeJob('daily-status-report', () => this.generateDailyStatusReport())
    })

    // Weekly Summary Report - Every Sunday at 10:00 AM
    this.scheduleJob('weekly-summary', '0 10 * * 0', async () => {
      await this.executeJob('weekly-summary', () => this.generateWeeklySummary())
    })

    // Health Ping - Every 6 hours
    this.scheduleJob('health-ping', '0 */6 * * *', async () => {
      await this.executeJob('health-ping', () => this.performHealthPing())
    })

    console.log(`MLM job scheduler initialized with ${this.jobs.size} jobs`)
    this.logJobSchedules()
  }

  /**
   * Schedule a single job
   */
  scheduleJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      console.warn(`Job ${name} already exists, skipping...`)
      return
    }

    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    })

    this.jobs.set(name, {
      job,
      schedule,
      task,
      lastRun: null,
      lastStatus: null,
      runCount: 0,
      enabled: true
    })

    job.start()
    console.log(`Scheduled job: ${name} (${schedule})`)
  }

  /**
   * Execute a job with error handling and logging
   */
  async executeJob(jobName, jobFunction) {
    const jobInfo = this.jobs.get(jobName)
    if (!jobInfo) {
      console.error(`Job ${jobName} not found`)
      return
    }

    const startTime = new Date()
    let result = null
    let error = null

    console.log(`[${jobName}] Starting execution at ${startTime.toISOString()}`)

    try {
      // Execute the job function
      result = await jobFunction()
      
      // Update job info
      jobInfo.lastRun = startTime
      jobInfo.lastStatus = 'success'
      jobInfo.runCount++

      console.log(`[${jobName}] Completed successfully in ${Date.now() - startTime.getTime()}ms`)

    } catch (err) {
      error = err
      jobInfo.lastStatus = 'failed'
      console.error(`[${jobName}] Failed:`, err)

      // Send failure notification
      await this.sendJobFailureNotification(jobName, err)
    }

    // Record in job history
    this.jobHistory.push({
      jobName,
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      status: error ? 'failed' : 'success',
      result,
      error: error?.message
    })

    // Keep only last 100 job executions in memory
    if (this.jobHistory.length > 100) {
      this.jobHistory.shift()
    }

    return { success: !error, result, error }
  }

  /**
   * Generate daily status report
   */
  async generateDailyStatusReport() {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // Get job executions from last 24 hours
    const recentJobs = this.jobHistory.filter(job => 
      job.startTime >= yesterday
    )

    const report = {
      date: today.toISOString().split('T')[0],
      totalJobs: recentJobs.length,
      successfulJobs: recentJobs.filter(j => j.status === 'success').length,
      failedJobs: recentJobs.filter(j => j.status === 'failed').length,
      avgDuration: recentJobs.length > 0 ? 
        recentJobs.reduce((sum, j) => sum + j.duration, 0) / recentJobs.length : 0,
      jobDetails: recentJobs.map(job => ({
        name: job.jobName,
        status: job.status,
        duration: job.duration,
        startTime: job.startTime,
        error: job.error
      })),
      systemHealth: await this.getSystemHealth()
    }

    console.log('Daily Status Report:', JSON.stringify(report, null, 2))
    
    // Send report to admin if there were any failures
    if (report.failedJobs > 0) {
      await this.sendStatusReport(report)
    }

    return report
  }

  /**
   * Generate weekly summary
   */
  async generateWeeklySummary() {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const weeklyJobs = this.jobHistory.filter(job => 
      job.startTime >= startDate
    )

    const summary = {
      week: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalExecutions: weeklyJobs.length,
      successRate: weeklyJobs.length > 0 ? 
        (weeklyJobs.filter(j => j.status === 'success').length / weeklyJobs.length * 100).toFixed(1) : 0,
      jobBreakdown: {},
      systemMetrics: await this.getWeeklyMetrics()
    }

    // Group by job name
    weeklyJobs.forEach(job => {
      if (!summary.jobBreakdown[job.jobName]) {
        summary.jobBreakdown[job.jobName] = {
          executions: 0,
          successes: 0,
          failures: 0,
          avgDuration: 0
        }
      }
      
      const breakdown = summary.jobBreakdown[job.jobName]
      breakdown.executions++
      if (job.status === 'success') breakdown.successes++
      else breakdown.failures++
      breakdown.avgDuration = (breakdown.avgDuration + job.duration) / breakdown.executions
    })

    console.log('Weekly Summary:', JSON.stringify(summary, null, 2))
    await this.sendWeeklySummary(summary)

    return summary
  }

  /**
   * Perform health ping
   */
  async performHealthPing() {
    const ping = {
      timestamp: new Date(),
      scheduler: 'active',
      activeJobs: this.jobs.size,
      enabledJobs: Array.from(this.jobs.values()).filter(j => j.enabled).length,
      lastJobExecution: this.jobHistory.length > 0 ? 
        this.jobHistory[this.jobHistory.length - 1].startTime : null
    }

    console.log('Health Ping:', ping)
    return ping
  }

  /**
   * Get current system health
   */
  async getSystemHealth() {
    try {
      // This would include checks for database connectivity, memory usage, etc.
      const health = {
        database: 'connected', // Implement actual DB check
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        activeJobs: Array.from(this.jobs.keys()).filter(name => 
          this.jobs.get(name).enabled
        )
      }

      return health
    } catch (error) {
      return { status: 'error', error: error.message }
    }
  }

  /**
   * Get weekly metrics
   */
  async getWeeklyMetrics() {
    try {
      // Implement actual metrics gathering
      return {
        usersProcessed: 'N/A', // Would query from job results
        paymentsProcessed: 'N/A',
        discrepanciesFixed: 'N/A',
        eligibilityChecks: 'N/A'
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  /**
   * Send job failure notification
   */
  async sendJobFailureNotification(jobName, error) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
      
      await sendEmail({
        to: adminEmail,
        subject: `MLM Job Failure: ${jobName}`,
        text: `Job ${jobName} failed at ${new Date().toISOString()}\n\nError: ${error.message}\n\nStack: ${error.stack}`,
        html: `
          <h2>MLM Job Failure Alert</h2>
          <p><strong>Job:</strong> ${jobName}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <pre>${error.stack}</pre>
        `
      })
    } catch (emailError) {
      console.error('Failed to send job failure notification:', emailError)
    }
  }

  /**
   * Send daily status report
   */
  async sendStatusReport(report) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
      
      await sendEmail({
        to: adminEmail,
        subject: `MLM Daily Status Report - ${report.failedJobs} Failures`,
        template: 'daily-status-report',
        data: report
      })
    } catch (error) {
      console.error('Failed to send status report:', error)
    }
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(summary) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
      
      await sendEmail({
        to: adminEmail,
        subject: `MLM Weekly Summary - ${summary.successRate}% Success Rate`,
        template: 'weekly-summary',
        data: summary
      })
    } catch (error) {
      console.error('Failed to send weekly summary:', error)
    }
  }

  /**
   * Log all scheduled jobs
   */
  logJobSchedules() {
    console.log('\n=== Scheduled Jobs ===')
    this.jobs.forEach((jobInfo, name) => {
      console.log(`${name}: ${jobInfo.schedule} (${jobInfo.enabled ? 'enabled' : 'disabled'})`)
    })
    console.log('=====================\n')
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    console.log('Stopping all scheduled jobs...')
    this.jobs.forEach((jobInfo, name) => {
      jobInfo.job.stop()
      console.log(`Stopped job: ${name}`)
    })
    this.jobs.clear()
  }

  /**
   * Enable/disable specific job
   */
  toggleJob(jobName, enable = true) {
    const jobInfo = this.jobs.get(jobName)
    if (!jobInfo) {
      throw new Error(`Job ${jobName} not found`)
    }

    if (enable) {
      jobInfo.job.start()
      jobInfo.enabled = true
      console.log(`Enabled job: ${jobName}`)
    } else {
      jobInfo.job.stop()
      jobInfo.enabled = false
      console.log(`Disabled job: ${jobName}`)
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobName = null) {
    if (jobName) {
      const jobInfo = this.jobs.get(jobName)
      return jobInfo ? {
        name: jobName,
        schedule: jobInfo.schedule,
        enabled: jobInfo.enabled,
        lastRun: jobInfo.lastRun,
        lastStatus: jobInfo.lastStatus,
        runCount: jobInfo.runCount
      } : null
    }

    // Return all jobs status
    const status = {}
    this.jobs.forEach((jobInfo, name) => {
      status[name] = {
        schedule: jobInfo.schedule,
        enabled: jobInfo.enabled,
        lastRun: jobInfo.lastRun,
        lastStatus: jobInfo.lastStatus,
        runCount: jobInfo.runCount
      }
    })
    return status
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobName) {
    const jobInfo = this.jobs.get(jobName)
    if (!jobInfo) {
      throw new Error(`Job ${jobName} not found`)
    }

    console.log(`Manually triggering job: ${jobName}`)
    return await this.executeJob(jobName, jobInfo.task)
  }

  /**
   * Get job execution history
   */
  getJobHistory(jobName = null, limit = 20) {
    let history = this.jobHistory
    
    if (jobName) {
      history = history.filter(job => job.jobName === jobName)
    }

    return history
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit)
  }
}

// Create and export singleton instance
const mlmScheduler = new MLMJobScheduler()

// Auto-initialize in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SCHEDULED_JOBS === 'true') {
  mlmScheduler.initialize()
}

export default mlmScheduler

// Named exports for direct job access
export {
  processWeeklyPayouts,
  retryFailedPayouts,
  processMonthlyEligibilitySweep,
  performTreeHealthCheck,
  performCommissionReconciliation
}
