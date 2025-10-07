import Head from "next/head";
import * as React from "react";

interface TripInviteEmailProps {
  inviteeName: string;
  inviterName: string;
  tripTitle: string;
  tripDescription: string | null;
  tripDates: string;
  role: string;
  inviteLink: string;
  expiresAt: string;
}

export const TripInviteEmail = ({
  inviteeName,
  inviterName,
  tripTitle,
  tripDescription,
  tripDates,
  role,
  inviteLink,
  expiresAt,
}: TripInviteEmailProps) => {
  const roleDescriptions = {
    viewer: "View all trip details and itinerary",
    editor: "View and edit locations, accommodations, flights, and expenses",
    admin: "Full editing access plus ability to manage collaborators",
  };

  return (
    <html>
      <Head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 8px;
          }
          h1 {
            color: #1e293b;
            font-size: 24px;
            margin-bottom: 16px;
          }
          .trip-card {
            background-color: #f8fafc;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .trip-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .trip-dates {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .trip-description {
            color: #475569;
            margin-top: 8px;
          }
          .role-badge {
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            margin: 16px 0;
          }
          .role-description {
            color: #64748b;
            font-size: 14px;
            margin-top: 8px;
          }
          .button {
            display: inline-block;
            background-color: #0ea5e9;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #0284c7;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
          }
          .expiry-notice {
            background-color: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
            color: #92400e;
          }
        `}</style>
      </Head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">✈️ Plavel</div>
          </div>

          <h1>🎉 You&apos;re invited to join a trip!</h1>

          <p>
            Hi{inviteeName ? ` ${inviteeName}` : ""},
          </p>

          <p>
            <strong>{inviterName}</strong> has invited you to collaborate on their trip planning.
          </p>

          <div className="trip-card">
            <div className="trip-title">{tripTitle}</div>
            <div className="trip-dates">📅 {tripDates}</div>
            {tripDescription && (
              <div className="trip-description">{tripDescription}</div>
            )}
          </div>

          <div>
            <p style={{ marginBottom: "8px" }}>You&apos;ve been invited as:</p>
            <span className="role-badge">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
            <div className="role-description">
              {roleDescriptions[role as keyof typeof roleDescriptions]}
            </div>
          </div>

          <div className="expiry-notice">
            ⏰ This invitation expires on {expiresAt}
          </div>

          <div style={{ textAlign: "center" }}>
            <a href={inviteLink} className="button">
              Accept Invitation
            </a>
          </div>

          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Or copy and paste this link into your browser:
            <br />
            <a href={inviteLink} style={{ color: "#0ea5e9", wordBreak: "break-all" }}>
              {inviteLink}
            </a>
          </p>

          <div className="footer">
            <p>
              This invitation was sent to you by {inviterName}.
              <br />
              If you didn&apos;t expect this invitation, you can safely ignore this email.
            </p>
            <p style={{ marginTop: "16px" }}>
              © 2025 Plavel. Made with ❤️ for travelers.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
