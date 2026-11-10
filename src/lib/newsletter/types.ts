// ==============================================================================
// The Executive Brief by OU DBM - Newsletter System Types
// ==============================================================================

export type SubscriberStatus = "active" | "unsubscribed";

export type RecipientSource = "newsletter_test_subscribers" | "subscribers";

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  subscribed_at: string;
}

export type CampaignStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "cancelled";

export type RecipientDeliveryStatus =
  | "pending"
  | "processing"
  | "accepted"
  | "failed"
  | "skipped";

export interface FeaturedArticleData {
  title: string;
  url: string;
  description: string;
  buttonText?: string;
  imageUrl?: string;
  category?: string;
  readingTime?: string;
}

export interface FooterSocialLink {
  platform: "linkedin" | "twitter" | "website" | "email";
  label: string;
  url: string;
}

export interface FooterData {
  brandName?: string;
  departmentName?: string;
  description?: string;
  websiteUrl?: string;
  contactEmail?: string;
  socialLinks?: FooterSocialLink[];
}

export interface NewsletterCampaign {
  id: string;
  campaign_name: string;
  email_subject: string;
  preview_text: string;
  sender_name: string;
  reply_to_email?: string;
  category: string;
  editor_content: any; // Tiptap JSON or string
  rendered_html?: string;
  featured_article_data?: FeaturedArticleData | null;
  footer_data?: FooterData | null;
  status: CampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  recipient_email: string;
  subscriber_id?: string;
  status: RecipientDeliveryStatus;
  attempt_count: number;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  last_attempt_at?: string | null;
  created_at: string;
}

export interface UnsubscribeToken {
  id: string;
  token_hash: string;
  subscriber_email: string;
  recipient_source: RecipientSource;
  created_at: string;
  used_at?: string | null;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface SendBatchProgress {
  campaignId: string;
  status: CampaignStatus;
  totalRecipients: number;
  processedCount: number;
  acceptedCount: number;
  failedCount: number;
  pendingCount: number;
  isComplete: boolean;
  message?: string;
}
