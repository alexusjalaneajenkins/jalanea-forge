import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Jalanea Forge <onboarding@resend.dev>'; // Change to your verified domain

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates
const templates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Jalanea Forge!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #f97316; }
          .content { background: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
          .features { margin: 24px 0; }
          .feature { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .feature:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JALANEA FORGE</div>
            <p style="color: #6b7280; margin-top: 8px;">AI Product Designer</p>
          </div>

          <div class="content">
            <h1 style="margin-top: 0;">Welcome, ${name}!</h1>
            <p>You've just unlocked the power of AI-driven product design. Jalanea Forge helps you go from idea to actionable PRD in minutes.</p>

            <div class="features">
              <div class="feature"><strong>Step 1: Idea</strong> - Describe your product vision</div>
              <div class="feature"><strong>Step 2: Research</strong> - Upload market research & insights</div>
              <div class="feature"><strong>Step 3: PRD</strong> - Generate a comprehensive product document</div>
              <div class="feature"><strong>Step 4: Roadmap</strong> - Get actionable development tasks</div>
            </div>

            <p>You have <strong>25 free AI generations</strong> to get started. Ready to build something amazing?</p>

            <p style="text-align: center; margin-top: 32px;">
              <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="button">Start Creating</a>
            </p>
          </div>

          <div class="footer">
            <p>Questions? Reply to this email - we're here to help!</p>
            <p>&copy; 2024 Jalanea Forge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionConfirmed: (name: string, plan: string, generations: number) => ({
    subject: `You're now on ${plan}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #f97316; }
          .content { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 32px; margin-bottom: 32px; color: white; }
          .button { display: inline-block; background: white; color: #6366f1; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JALANEA FORGE</div>
          </div>

          <div class="content">
            <div class="badge">${plan.toUpperCase()} PLAN</div>
            <h1 style="margin-top: 0;">Welcome to ${plan}, ${name}!</h1>
            <p>Your subscription is now active. Here's what you've unlocked:</p>

            <ul style="margin: 24px 0;">
              <li><strong>${generations} AI generations</strong> per month</li>
              <li>${plan === 'Pro' ? 'Unlimited' : '10'} projects</li>
              <li>Export PRD to PDF</li>
              <li>Version history</li>
              ${plan === 'Pro' ? '<li>Priority support</li><li>Early access to new features</li>' : ''}
            </ul>

            <p style="text-align: center; margin-top: 32px;">
              <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="button">Continue Building</a>
            </p>
          </div>

          <div class="footer">
            <p>Manage your subscription anytime from your account settings.</p>
            <p>&copy; 2024 Jalanea Forge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionCancelled: (name: string) => ({
    subject: 'Your subscription has been cancelled',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #f97316; }
          .content { background: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JALANEA FORGE</div>
          </div>

          <div class="content">
            <h1 style="margin-top: 0;">We're sorry to see you go, ${name}</h1>
            <p>Your subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>

            <p>After that, you'll be moved to our Free plan with:</p>
            <ul>
              <li>25 AI generations per month</li>
              <li>3 projects</li>
              <li>Basic features</li>
            </ul>

            <p>Changed your mind? You can resubscribe anytime:</p>

            <p style="text-align: center; margin-top: 32px;">
              <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="button">Resubscribe</a>
            </p>
          </div>

          <div class="footer">
            <p>We'd love to hear your feedback - reply to this email to let us know how we can improve.</p>
            <p>&copy; 2024 Jalanea Forge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  usageAlert: (name: string, used: number, limit: number, percentage: number) => ({
    subject: percentage >= 100 ? 'You\'ve used all your AI generations' : `You've used ${percentage}% of your AI generations`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #f97316; }
          .content { background: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 32px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
          .progress-bar { background: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden; margin: 16px 0; }
          .progress-fill { background: ${percentage >= 100 ? '#ef4444' : percentage >= 80 ? '#f59e0b' : '#22c55e'}; height: 100%; border-radius: 10px; }
          .usage-text { text-align: center; font-size: 24px; font-weight: bold; color: ${percentage >= 100 ? '#ef4444' : '#333'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JALANEA FORGE</div>
          </div>

          <div class="content">
            <h1 style="margin-top: 0;">${percentage >= 100 ? 'You\'ve reached your limit' : 'Usage Alert'}, ${name}</h1>

            <div class="usage-text">${used} / ${limit} generations used</div>

            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>

            ${percentage >= 100
              ? '<p>You\'ve used all your AI generations for this month. Upgrade now to keep building!</p>'
              : `<p>You've used ${percentage}% of your monthly AI generations. Consider upgrading to get more!</p>`
            }

            <p style="text-align: center; margin-top: 32px;">
              <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="button">Upgrade Now</a>
            </p>
          </div>

          <div class="footer">
            <p>Your generations reset at the start of each billing cycle.</p>
            <p>&copy; 2024 Jalanea Forge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

type EmailType = 'welcome' | 'subscriptionConfirmed' | 'subscriptionCancelled' | 'usageAlert';

interface EmailRequest {
  type: EmailType;
  to: string;
  name: string;
  // For subscription emails
  plan?: string;
  generations?: number;
  // For usage alerts
  used?: number;
  limit?: number;
  percentage?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, to, name, plan, generations, used, limit, percentage }: EmailRequest = await req.json();

    if (!type || !to || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, to, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailContent;
    switch (type) {
      case 'welcome':
        emailContent = templates.welcome(name);
        break;
      case 'subscriptionConfirmed':
        emailContent = templates.subscriptionConfirmed(name, plan || 'Starter', generations || 100);
        break;
      case 'subscriptionCancelled':
        emailContent = templates.subscriptionCancelled(name);
        break;
      case 'usageAlert':
        emailContent = templates.usageAlert(name, used || 0, limit || 25, percentage || 0);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Email sent: ${type} to ${to}`);
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
