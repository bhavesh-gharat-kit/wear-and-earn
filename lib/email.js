// Basic email utility for MLM jobs
// Replace with your actual email service (Nodemailer, SendGrid, etc.)

/**
 * Send email utility
 * This is a basic implementation - replace with your actual email service
 */
export async function sendEmail({ to, subject, text, html, template, data }) {
  try {
    // If using template, render it with data
    if (template && data) {
      const renderedContent = renderEmailTemplate(template, data)
      html = renderedContent.html
      text = renderedContent.text || text
    }

    // Log the email instead of actually sending in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email (Development Mode):')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Body: ${text || html}`)
      return { success: true, messageId: `dev-${Date.now()}` }
    }

    // In production, use your actual email service
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
      html
    })

    return { success: true, messageId: result.messageId }
    */

    // Placeholder for production
    console.log(`📧 Would send email to ${to}: ${subject}`)
    return { success: true, messageId: `placeholder-${Date.now()}` }

  } catch (error) {
    console.error('Email sending failed:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Render email templates
 */
function renderEmailTemplate(template, data) {
  const templates = {
    'payment-notification': {
      html: `
        <h2>Payment Credited to Your Wallet</h2>
        <p>Dear ${data.userName},</p>
        <p>We're pleased to inform you that a payment of <strong>₹${data.amount}</strong> has been credited to your wallet.</p>
        <ul>
          <li><strong>Payment Type:</strong> ${data.paymentType}</li>
          <li><strong>Date:</strong> ${data.payoutDate}</li>
          <li><strong>Transaction ID:</strong> ${data.transactionId}</li>
          <li><strong>New Balance:</strong> ₹${data.walletBalance}</li>
        </ul>
        <p>Thank you for being part of our community!</p>
      `,
      text: `Payment Credited: ₹${data.amount} has been added to your wallet. New balance: ₹${data.walletBalance}`
    },

    'eligibility-notification': {
      html: `
        <h2>Monthly Eligibility ${data.eligible ? 'Confirmed' : 'Update'}</h2>
        <p>Dear ${data.userName},</p>
        ${data.eligible ? 
          '<p>Congratulations! You meet all eligibility requirements for this month.</p>' :
          `<p>Your account did not meet the eligibility requirements for ${data.month}.</p>
           <p><strong>Monthly Purchase:</strong> ₹${data.monthlyPurchase} (Required: ₹${data.requiredPurchase})</p>
           <p><strong>KYC Status:</strong> ${data.kycApproved ? 'Approved' : 'Pending'}</p>
           ${data.rolledUpAmount > 0 ? `<p><strong>Rolled Up Amount:</strong> ₹${data.rolledUpAmount}</p>` : ''}`
        }
        <h3>Next Steps:</h3>
        <ul>
          ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      `,
      text: `Monthly eligibility ${data.eligible ? 'confirmed' : 'requirements not met'} for ${data.month}`
    },

    'admin-monthly-summary': {
      html: `
        <h2>Monthly Eligibility Sweep Complete</h2>
        <p><strong>Job ID:</strong> ${data.jobId}</p>
        <p><strong>Month:</strong> ${data.month}</p>
        <h3>Summary:</h3>
        <ul>
          <li>Eligible Users: ${data.eligibleUsers}</li>
          <li>Ineligible Users: ${data.ineligibleUsers}</li>
          <li>Total Users: ${data.totalUsers}</li>
          <li>Eligibility Rate: ${data.eligibilityRate}%</li>
          <li>Total Rolled Up: ₹${data.totalRolledUp}</li>
          <li>Errors: ${data.errorCount}</li>
        </ul>
      `,
      text: `Monthly sweep completed for ${data.month}. ${data.eligibleUsers} eligible, ${data.ineligibleUsers} ineligible.`
    },

    'tree-health-alert': {
      html: `
        <h2 style="color: ${data.healthScore < 75 ? 'red' : 'orange'}">MLM Tree Health Alert</h2>
        <p><strong>Job ID:</strong> ${data.jobId}</p>
        <p><strong>Health Score:</strong> ${data.healthScore}% (${data.healthStatus})</p>
        <p><strong>Issues Found:</strong> ${data.issuesFound}</p>
        <p><strong>Issues Fixed:</strong> ${data.issuesFixed}</p>
        <p><strong>Critical Errors:</strong> ${data.criticalErrorCount}</p>
        
        ${data.topCriticalErrors.length > 0 ? `
          <h3>Top Critical Errors:</h3>
          <ul>
            ${data.topCriticalErrors.map(error => `<li>${error.issue}</li>`).join('')}
          </ul>
        ` : ''}
        
        <h3>Recommendations:</h3>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      `,
      text: `Tree health alert: ${data.healthScore}% score with ${data.criticalErrorCount} critical errors`
    },

    'reconciliation-alert': {
      html: `
        <h2>Financial Reconciliation Alert</h2>
        <p><strong>Job ID:</strong> ${data.jobId}</p>
        <p><strong>Users Checked:</strong> ${data.usersChecked}</p>
        <p><strong>Discrepancies Found:</strong> ${data.discrepanciesFound}</p>
        <p><strong>Total Discrepancy Amount:</strong> ₹${data.totalDiscrepancyAmount}</p>
        <p><strong>Accuracy:</strong> ${data.accuracy}%</p>
        <p><strong>Health Score:</strong> ${data.healthScore}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Auto Corrections:</strong> ${data.autoCorrections}</p>
        
        ${data.topCriticalIssues.length > 0 ? `
          <h3>Critical Issues:</h3>
          <ul>
            ${data.topCriticalIssues.map(issue => `<li>${issue.type}: ${issue.issue || issue.error}</li>`).join('')}
          </ul>
        ` : ''}
        
        <h3>Recommendations:</h3>
        <ul>
          ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      `,
      text: `Reconciliation completed: ${data.discrepanciesFound} discrepancies, ₹${data.totalDiscrepancyAmount} total difference`
    }
  }

  const template_content = templates[template]
  if (!template_content) {
    throw new Error(`Email template '${template}' not found`)
  }

  return {
    html: template_content.html,
    text: template_content.text
  }
}

/**
 * Send notification to multiple recipients
 */
export async function sendBulkEmail(recipients, emailData) {
  const results = []
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        ...emailData,
        to: recipient
      })
      results.push({ recipient, success: true, messageId: result.messageId })
    } catch (error) {
      results.push({ recipient, success: false, error: error.message })
    }
  }
  
  return results
}

/**
 * Queue email for later sending (useful for high volume)
 */
export async function queueEmail(emailData) {
  // In a real implementation, this would add to a job queue
  // For now, just send immediately
  return await sendEmail(emailData)
}
