// ==============================================================================
// The Executive Brief by OU DBM
// Production Gmail SMTP & Resumable Batch Sending Engine
// Enforces security, idempotency, bounded retries, and failure auditing
// ==============================================================================

import nodemailer from "nodemailer";
import {
  NewsletterCampaign,
  CampaignRecipient,
  RecipientSource,
  SMTPConfig,
  SendBatchProgress,
} from "./types";
import {
  getCampaignById,
  updateCampaign,
  snapshotCampaignRecipients,
  getCampaignRecipients,
  updateRecipientStatus,
} from "./campaignRepository";
import { getRecipientSource } from "./subscriberRepository";
import {
  renderNewsletterHtml,
  renderNewsletterPlainText,
} from "./emailRenderer";
import { getListUnsubscribeHeaders } from "./unsubscribeService";

/**
 * Validates and retrieves server-side SMTP configuration.
 * Never exposes credentials to client or error responses.
 */
export function getSMTPConfig(): { config: SMTPConfig | null; error?: string } {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const fromName = process.env.NEWSLETTER_FROM_NAME || "The Executive Brief";
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || user || "executivebrief@oudbm.ac.in";
  const replyTo = process.env.NEWSLETTER_REPLY_TO || "executivebrief@oudbm.ac.in";

  if (!user || user.length === 0 || user.includes("your-email@gmail.com")) {
    return {
      config: null,
      error: "SMTP_USER is not configured in local environment (.env.local).",
    };
  }

  if (!pass || pass.length === 0 || pass.includes("your-gmail-app-password")) {
    return {
      config: null,
      error: "SMTP_PASS (Gmail App Password) is not configured in local environment (.env.local).",
    };
  }

  return {
    config: {
      host,
      port,
      secure,
      user,
      pass,
      fromName,
      fromEmail,
      replyTo,
    },
  };
}

/**
 * Creates a Nodemailer transporter.
 */
function createTransporter(config: SMTPConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Safe timeout limits
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Verifies live SMTP connectivity without sending messages.
 */
export async function verifySMTPConnection(): Promise<{
  verified: boolean;
  message: string;
}> {
  const { config, error } = getSMTPConfig();
  if (!config) {
    return {
      verified: false,
      message: error || "SMTP configuration incomplete.",
    };
  }

  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return {
      verified: true,
      message: `Connected successfully to ${config.host}:${config.port} as ${config.user}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP handshake failed.";
    return {
      verified: false,
      message: `SMTP verification failed: ${msg}`,
    };
  }
}

/**
 * Sends a single newsletter email to a recipient with RFC compliance.
 */
export async function sendSingleNewsletterEmail(
  campaign: NewsletterCampaign,
  recipientEmail: string,
  recipientSource: RecipientSource
): Promise<{ accepted: boolean; messageId?: string; error?: string }> {
  const { config, error } = getSMTPConfig();
  if (!config) {
    return { accepted: false, error: error || "SMTP unconfigured." };
  }

  const html = renderNewsletterHtml(campaign, {
    recipientEmail,
    recipientSource,
  });
  const text = renderNewsletterPlainText(campaign, {
    recipientEmail,
    recipientSource,
  });
  const unsubscribeHeaders = getListUnsubscribeHeaders(
    recipientEmail,
    recipientSource
  );

  const transporter = createTransporter(config);

  try {
    const info = await transporter.sendMail({
      from: `"${campaign.sender_name || config.fromName}" <${config.fromEmail}>`,
      to: recipientEmail,
      replyTo: campaign.reply_to_email || config.replyTo,
      subject: campaign.email_subject,
      text,
      html,
      headers: {
        ...unsubscribeHeaders,
        "X-Mailer": "The Executive Brief Newsletter Engine",
        "X-Campaign-ID": campaign.id,
      },
    });

    const isAccepted = Array.isArray(info.accepted) && info.accepted.length > 0;
    return {
      accepted: isAccepted,
      messageId: info.messageId,
      error: isAccepted ? undefined : "Message was not accepted by SMTP gateway.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP delivery error.";
    return {
      accepted: false,
      error: msg,
    };
  }
}

/**
 * Processes a bounded, resumable batch of campaign recipients.
 * Enforces idempotency and prevents duplicate sends.
 */
export async function processCampaignBatch(
  campaignId: string,
  batchSize: number = 5
): Promise<SendBatchProgress> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  if (campaign.status === "completed" || campaign.status === "cancelled") {
    const recipients = await getCampaignRecipients(campaignId);
    const accepted = recipients.filter((r) => r.status === "accepted").length;
    const failed = recipients.filter((r) => r.status === "failed").length;
    return {
      campaignId,
      status: campaign.status,
      totalRecipients: recipients.length,
      processedCount: accepted + failed,
      acceptedCount: accepted,
      failedCount: failed,
      pendingCount: 0,
      isComplete: true,
      message: `Campaign is already ${campaign.status}.`,
    };
  }

  // 1. Snapshot recipients if not already done
  let recipients = await getCampaignRecipients(campaignId);
  if (recipients.length === 0) {
    recipients = await snapshotCampaignRecipients(campaignId);
  }

  // 2. Mark campaign processing
  if (campaign.status !== "processing") {
    await updateCampaign(campaignId, {
      status: "processing",
      started_at: campaign.started_at || new Date().toISOString(),
    });
  }

  // 3. Select pending recipients (bounded batch)
  const pending = recipients.filter((r) => r.status === "pending" || r.status === "processing");
  const batch = pending.slice(0, batchSize);

  const recipientSource = getRecipientSource();

  for (const item of batch) {
    // Small pacing delay to respect SMTP rate limits
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const result = await sendSingleNewsletterEmail(
        campaign,
        item.recipient_email,
        recipientSource
      );

      if (result.accepted) {
        await updateRecipientStatus(item.id, campaignId, {
          status: "accepted",
          providerMessageId: result.messageId,
        });
      } else {
        await updateRecipientStatus(item.id, campaignId, {
          status: "failed",
          errorMessage: result.error || "Delivery rejected by SMTP host.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected send error.";
      await updateRecipientStatus(item.id, campaignId, {
        status: "failed",
        errorMessage: msg,
      });
    }
  }

  // 4. Re-calculate status and totals
  const allRecipients = await getCampaignRecipients(campaignId);
  const acceptedCount = allRecipients.filter((r) => r.status === "accepted").length;
  const failedCount = allRecipients.filter((r) => r.status === "failed").length;
  const remainingPending = allRecipients.filter(
    (r) => r.status === "pending" || r.status === "processing"
  ).length;

  const isComplete = remainingPending === 0;
  let finalStatus: NewsletterCampaign["status"] = "processing";

  if (isComplete) {
    if (failedCount === 0) {
      finalStatus = "completed";
    } else if (acceptedCount === 0) {
      finalStatus = "failed";
    } else {
      finalStatus = "completed_with_errors";
    }

    await updateCampaign(campaignId, {
      status: finalStatus,
      sent_count: acceptedCount,
      failed_count: failedCount,
      completed_at: new Date().toISOString(),
    });
  } else {
    await updateCampaign(campaignId, {
      sent_count: acceptedCount,
      failed_count: failedCount,
    });
  }

  return {
    campaignId,
    status: isComplete ? finalStatus : "processing",
    totalRecipients: allRecipients.length,
    processedCount: acceptedCount + failedCount,
    acceptedCount,
    failedCount,
    pendingCount: remainingPending,
    isComplete,
    message: isComplete
      ? `Campaign processing finished. ${acceptedCount} accepted, ${failedCount} failed.`
      : `Batch processed. ${remainingPending} recipients remaining in queue.`,
  };
}
