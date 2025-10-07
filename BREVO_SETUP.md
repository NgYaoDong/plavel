# Brevo Email Setup Guide

Your trip invitation system now uses Brevo (formerly Sendinblue) - completely free with 300 emails/day!

## ✨ Why Brevo?

- ✅ **300 emails/day forever** - No credit card required
- ✅ **Send to anyone** - No domain verification needed for testing
- ✅ **Reliable delivery** - Professional email service
- ✅ **Easy setup** - 5 minutes to get started

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Brevo Account

1. Go to [brevo.com](https://www.brevo.com)
2. Click "Sign up free"
3. Fill in your details
4. Verify your email address

### Step 2: Get Your API Key

1. Log in to [app.brevo.com](https://app.brevo.com)
2. Go to **Settings** → **SMTP & API** → **API Keys**
   - Or direct link: [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
3. Click **"Generate a new API key"**
4. Give it a name (e.g., "Plavel Invites")
5. Copy the API key (starts with `xkeysib-...`)
   - ⚠️ Save it now! You won't be able to see it again

### Step 3: Add to Environment Variables

Add this to your `.env.local` file:

```env
BREVO_API_KEY="xkeysib-your-api-key-here"

# IMPORTANT: Use the email you signed up to Brevo with (automatically verified)
# Example: if you signed up with gmail, use that gmail address
BREVO_SENDER_EMAIL="your-brevo-account-email@gmail.com"
BREVO_SENDER_NAME="Plavel"
```

⚠️ **CRITICAL:** `BREVO_SENDER_EMAIL` must be:

- The **exact email address** you used to sign up for Brevo
- This email is automatically verified by Brevo
- If you use any other email, you'll get "sender not valid" errors

### Step 4: Restart Dev Server

```bash
npm run dev
```

### Step 5: Test It

1. Create a trip in your app
2. Click the **Share** button
3. Enter any email address (can be anyone!)
4. Click **Send Invite**
5. Check the recipient's inbox! 📧

---

## 📧 Email Features

### What the Email Includes

- ✅ Beautiful HTML template
- ✅ Trip title, dates, and description
- ✅ Role information (Viewer/Editor/Admin)
- ✅ "Accept Invitation" button
- ✅ Direct link to invite page
- ✅ Expiry notice (7 days)
- ✅ Personalized greeting

### Email Flow

1. User clicks "Share" on a trip
2. Enters friend's email and selects role
3. System creates invite in database
4. **Brevo sends beautiful HTML email**
5. Recipient clicks "Accept Invitation" button
6. Redirected to your app's invite page
7. Accepts → Added to trip with correct permissions!

---

## 🎯 Free Tier Limits

| Feature | Brevo Free Tier |
|---------|----------------|
| **Emails/day** | 300 |
| **Emails/month** | ~9,000 |
| **Credit card** | Not required ❌ |
| **Domain verification** | Not required for basic sending ❌ |
| **Recipients** | Anyone ✅ |
| **Duration** | Forever ✅ |

This is perfect for:

- Development and testing
- Small to medium projects
- Personal projects
- MVP launches

---

## 🔧 Advanced Configuration

### Use Custom Domain (Optional)

If you want professional emails like `invites@yourdomain.com`:

1. **Verify your domain in Brevo:**
   - Go to **Senders & IP** → **Domains**
   - Add your domain
   - Add DNS records (SPF, DKIM, DMARC)

2. **Update environment variables:**

   ```env
   BREVO_SENDER_EMAIL="invites@yourdomain.com"
   BREVO_SENDER_NAME="Plavel"
   ```

### Monitor Email Stats

View detailed analytics in Brevo dashboard:

- Emails sent
- Delivery rate
- Opens and clicks
- Bounces
- Spam reports

Go to: [Statistics Dashboard](https://app.brevo.com/statistics/email)

---

## 🐛 Troubleshooting

### "Sender not valid" or "Validate your sender" Error

**This is the most common issue!**

**Error message:** `Sending has been rejected because the sender you used noreply@plavel.com is not valid`

**Solution:**

- ✅ Use the **exact email address** you signed up to Brevo with
- ✅ Update `.env.local`: `BREVO_SENDER_EMAIL="your-brevo-signup-email@gmail.com"`
- ✅ Restart your dev server after changing the email
- ❌ Don't use: <noreply@plavel.com>, <invites@yourdomain.com>, or any unverified email

**Why?** Brevo automatically verifies the email you sign up with. Any other email needs manual verification with domain records (SPF/DKIM).

**Quick fix:**

```env
# If you signed up with myemail@gmail.com, use:
BREVO_SENDER_EMAIL="myemail@gmail.com"
BREVO_SENDER_NAME="Plavel"
```

### "Invalid API key" Error

**Solution:**

- Check your API key is correctly copied
- Make sure there are no extra spaces
- Key should start with `xkeysib-`
- Restart your dev server after adding the key

### Email Not Arriving

**Check these:**

1. ✅ API key is correct in `.env.local`
2. ✅ Recipient email address is valid
3. ✅ Check spam/junk folder
4. ✅ Verify in Brevo dashboard under "Statistics" → "Email"
5. ✅ Check Brevo account isn't suspended (unlikely for new accounts)

### "Account suspended" Error

**Rare, but if it happens:**

- Contact Brevo support
- Usually happens if they detect suspicious activity
- Verify your account details are correct

### Sender Name Not Showing

If using default sender, the email will come from your Brevo account email. To customize:

```env
BREVO_SENDER_NAME="Plavel"
BREVO_SENDER_EMAIL="your-verified-email@gmail.com"
```

---

## 📊 Usage Tips

### For Development

- Default sender works fine
- Test with real email addresses
- Check Brevo dashboard to confirm delivery

### For Production

- Verify a custom domain
- Set up DKIM/SPF records
- Monitor delivery rates
- Consider upgrading if you exceed 300/day

---

## 🔄 Switching Email Providers

If you want to switch to another provider later:

### Back to Resend

1. Uninstall Brevo: `npm uninstall @getbrevo/brevo`
2. Install Resend: `npm install resend`
3. Update `send-invite.ts` imports and API calls
4. Update environment variables

### To SendGrid or Others

Similar process - just update the SDK and API calls in `send-invite.ts`

---

## 💡 Pro Tips

1. **Test thoroughly** - Send invites to yourself first
2. **Monitor dashboard** - Check delivery rates in Brevo
3. **Customize templates** - Edit `TripInviteEmail.tsx` for styling
4. **Track stats** - Use Brevo's built-in analytics
5. **Upgrade when needed** - If you exceed 300/day, paid plans start at $25/month

---

## 🎉 You're All Set

Your trip invitation system now uses Brevo with:

- ✅ 300 free emails per day
- ✅ No credit card required
- ✅ Send to anyone
- ✅ Professional delivery
- ✅ Beautiful HTML emails

Start sending invitations and building your collaborative trip planning app! 🚀✈️

---

## 📚 Resources

- [Brevo Documentation](https://developers.brevo.com/)
- [Brevo Dashboard](https://app.brevo.com)
- [API Keys Management](https://app.brevo.com/settings/keys/api)
- [Email Statistics](https://app.brevo.com/statistics/email)
- [Support](https://help.brevo.com/)
