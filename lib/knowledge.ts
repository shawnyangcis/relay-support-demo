export const articles = [
  {
    id: "billing-invoices",
    category: "Billing",
    title: "Find and download an invoice",
    content:
      "Workspace owners and billing admins can download invoices. Open Settings > Billing > Invoice history, select the invoice, then choose Download PDF. Members cannot access billing; ask a workspace owner or billing admin for the invoice. Invoices show the billing details that were saved at the time of payment. A support agent must review requests to correct an issued invoice.",
  },
  {
    id: "login-reset",
    category: "Account access",
    title: "Reset a password or expired link",
    content:
      "On the Northstar sign-in page, choose Forgot password and enter the email used for your workspace. Password reset links expire after 30 minutes. Request a new link and use only the most recent email; requesting a new link invalidates older links. If the newest link still fails, copy its full URL into a private browser window. Never share a password or reset link in chat. If that also fails, a support agent should review account access.",
  },
  {
    id: "login-email",
    category: "Account access",
    title: "A reset email has not arrived",
    content:
      "Check spam and junk folders and confirm you entered the email used for your Northstar workspace. Allow up to 5 minutes for the reset email. If it has not arrived, request one new email and check whether your company mail filter blocks it. Avoid repeated requests: only the newest reset link works. If the email still does not arrive, ask a support agent to investigate. Do not share passwords, authentication codes, or reset links.",
  },
  {
    id: "login-sso",
    category: "Account access",
    title: "Sign in with your organization",
    content:
      "If your workspace uses single sign-on (SSO), choose Continue with SSO and enter your work email. Your organization manages the password through its identity provider; Northstar password reset does not reset an SSO password. Ask your workspace admin to confirm your access and organization sign-in method. If access is still blocked, a support agent can review the issue with your admin. No specific identity provider compatibility is guaranteed by this sample documentation.",
  },
  {
    id: "plan-change",
    category: "Billing",
    title: "Manage a plan or cancellation",
    content:
      "Only workspace owners can change the Northstar subscription at Settings > Billing > Manage plan. An upgrade takes effect immediately; review the displayed charge before confirming. A cancellation takes effect at the end of the current billing period, and access continues until then. A refund request must be reviewed by a support agent; this sample documentation does not guarantee refund eligibility or a refund amount. The assistant cannot modify subscriptions, process refunds, or access payment data.",
  },
  {
    id: "team-invites",
    category: "Workspace",
    title: "Invite someone to your workspace",
    content:
      "Workspace owners and admins can open Settings > People > Invite member, enter the teammate’s work email, choose a role, and send the invitation. Invitations expire after 7 days. If a link has expired, an owner or admin can resend it from Settings > People > Pending invitations. Resending invalidates the previous invitation. Members cannot invite users unless an admin changes their role. The assistant cannot send invitations or change permissions.",
  },
] as const;
export type Article = (typeof articles)[number];
export type ArticleId = Article["id"];
export const knowledgeContext = articles
  .map((a) => `[${a.id}] ${a.title}\n${a.content}`)
  .join("\n\n");
