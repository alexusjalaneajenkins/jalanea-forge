import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Alexus from Jalanea Forge <forge@jalanea.works>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple, personal email style
const baseStyle = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.8;
    color: #374151;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  a { color: #6366f1; }
  .link-button {
    display: inline-block;
    background: #6366f1;
    color: white !important;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    margin: 8px 4px 8px 0;
  }
  .signature {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
  }
`;

// Email templates - personal, founder-style
const templates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Jalanea Forge',
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <p>Hey ${name},</p>

        <p>I'm Alexus — the creator of Jalanea Forge.</p>

        <p>I built Jalanea Forge because I believe everyone has great ideas, but turning those ideas into something real — a product, a business, a solution — can feel overwhelming. That's where we come in.</p>

        <p>Jalanea Forge uses AI to help you go from a spark of an idea to a concrete plan you can actually execute. No more staring at blank pages or wondering "where do I even start?"</p>

        <p><strong>Here's how to get started:</strong></p>

        <p>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Describe your idea</a>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Generate your PRD</a>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Get your roadmap</a>
        </p>

        <p>You've got <strong>25 free AI generations</strong> to explore. That's enough to fully develop a few ideas and see what's possible.</p>

        <p><strong>P.S.:</strong> What idea are you working on? What brought you here?</p>

        <p>Hit "Reply" and let me know. I read every email.</p>

        <div class="signature">
          <p>Cheers,<br><strong>Alexus</strong><br>Founder, Jalanea Forge</p>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionConfirmed: (name: string, plan: string, generations: number) => ({
    subject: `You're in — welcome to ${plan}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <p>Hey ${name},</p>

        <p>Thank you. Seriously.</p>

        <p>By upgrading to ${plan}, you're not just getting more AI generations — you're investing in your ideas. And that means a lot to me.</p>

        <p><strong>Here's what you now have access to:</strong></p>

        <ul>
          <li><strong>${generations} AI generations</strong> per month</li>
          <li>${plan === 'Pro' ? 'Unlimited' : '10'} projects</li>
          <li>Export your PRDs to PDF</li>
          <li>Full version history</li>
          ${plan === 'Pro' ? '<li>Priority support (yes, I actually respond)</li>' : ''}
        </ul>

        <p>Now the real question: <strong>What are you going to build?</strong></p>

        <p>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Start a new project</a>
        </p>

        <p>If you ever need help or have feedback, just reply to this email. I'm here.</p>

        <div class="signature">
          <p>Let's build something great,<br><strong>Alexus</strong><br>Founder, Jalanea Forge</p>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionCancelled: (name: string) => ({
    subject: 'You\'re always welcome back',
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <p>Hey ${name},</p>

        <p>I saw that you cancelled your subscription. No hard feelings — I get it.</p>

        <p>You'll still have access to your current plan until the end of your billing period. After that, you'll be on the Free plan with 25 generations per month and 3 projects.</p>

        <p>Your projects aren't going anywhere. They'll be here if you ever want to pick up where you left off.</p>

        <p><strong>One quick ask:</strong> Would you mind telling me why you cancelled? Was it the price? Missing features? Something else?</p>

        <p>Your feedback genuinely helps me make Jalanea Forge better. Just hit reply.</p>

        <p>And if you ever want to come back, it's just one click:</p>

        <p>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Resubscribe</a>
        </p>

        <div class="signature">
          <p>Thanks for giving us a shot,<br><strong>Alexus</strong><br>Founder, Jalanea Forge</p>
        </div>
      </body>
      </html>
    `,
  }),

  usageAlert: (name: string, used: number, limit: number, percentage: number) => ({
    subject: percentage >= 100
      ? 'You\'ve hit your limit — but your ideas don\'t have to stop'
      : `Quick heads up: ${percentage}% of your generations used`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <p>Hey ${name},</p>

        ${percentage >= 100
          ? `<p>You've used all <strong>${limit} AI generations</strong> this month. That's actually awesome — it means you're putting in the work.</p>

             <p>But I don't want your momentum to stop. If you're in the middle of something, upgrading takes 30 seconds:</p>`
          : `<p>Just a quick heads up — you've used <strong>${used} of your ${limit}</strong> AI generations this month (${percentage}%).</p>

             <p>If you're working on something big and might need more, now's a good time to think about upgrading:</p>`
        }

        <p>
          <a href="https://alexusjalaneajenkins.github.io/jalanea-forge/" class="link-button">Upgrade now</a>
        </p>

        <p>Your generations reset at the start of each billing cycle. ${percentage >= 100 ? 'Or you can wait it out — no pressure.' : ''}</p>

        <div class="signature">
          <p>Keep building,<br><strong>Alexus</strong><br>Founder, Jalanea Forge</p>
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
  plan?: string;
  generations?: number;
  used?: number;
  limit?: number;
  percentage?: number;
}

serve(async (req) => {
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
