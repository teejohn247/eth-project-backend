# Account Activation Instructions

## Overview
This document provides instructions for activating inactive user accounts and sending notification emails.

## Files Created

1. **`scripts/activate-inactive-users.js`** - Script to activate specific user accounts
2. **`email-template-activation.html`** - HTML email template for activation notifications
3. **`email-template-activation.txt`** - Plain text version of the email template

## Step 1: Activate User Accounts

### Run the Activation Script

```bash
node scripts/activate-inactive-users.js
```

### What the Script Does:
- Connects to the MongoDB database
- Finds users by email address
- Sets `isActive` to `true`
- Sets password to: **`EdoTalent2025!`**
- Updates the `updatedAt` timestamp
- Displays a summary of activated accounts

### Accounts to be Activated:
1. evanchenthesurgeon@gmail.com - Agbonlahor Osawoname (Divine)
2. classicosonic7@gmail.com - Agbonlahor Osawoname (Divine)
3. benardgregory935@gmail.com - Uwa Matthew (Osayande)
4. lovethowenaze85@gmail.com - Owenaze (Minloveth)
5. omofowaaroma@gmail.com - Nath (Cha)
6. ehizpraize58@gmail.com - EHIZPRAIZE (OSEMWENGIE)
7. osasokunrobo1@gmail.com - Paul (Osas)

## Step 2: Send Activation Emails

### Email Template Variables to Replace:

Before sending emails, replace these placeholders in the templates:

- `[FIRST_NAME]` - User's first name
- `[LAST_NAME]` - User's last name
- `[USER_EMAIL]` - User's email address
- `[LOGIN_URL]` - Your application's login URL

### Example for First User:

**HTML Version:**
```html
Replace:
- [FIRST_NAME] → Agbonlahor
- [LAST_NAME] → Osawoname
- [USER_EMAIL] → evanchenthesurgeon@gmail.com
- [LOGIN_URL] → https://your-app-url.com/login
```

**Text Version:**
Same replacements as above.

### Email Details:

**Subject:** Your Edo Talent Hunt Account Has Been Activated

**From:** Edo Talent Hunt <noreply@edotalenthunt.com> (or your official email)

**Recipients:**
1. evanchenthesurgeon@gmail.com
2. classicosonic7@gmail.com
3. benardgregory935@gmail.com
4. lovethowenaze85@gmail.com
5. omofowaaroma@gmail.com
6. ehizpraize58@gmail.com
7. osasokunrobo1@gmail.com

## Step 3: Using an Email Service

### Option 1: Manual Email (Small Scale)

1. Open the HTML template in a browser
2. Replace the placeholders for each user
3. Copy the rendered HTML
4. Send via your email client (Gmail, Outlook, etc.)

### Option 2: Email Service API (Recommended for Bulk)

Use a service like SendGrid, Mailgun, or AWS SES:

```javascript
// Example using SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const users = [
  { firstName: 'Agbonlahor', lastName: 'Osawoname', email: 'evanchenthesurgeon@gmail.com' },
  // ... other users
];

for (const user of users) {
  const htmlContent = emailTemplate
    .replace('[FIRST_NAME]', user.firstName)
    .replace('[LAST_NAME]', user.lastName)
    .replace('[USER_EMAIL]', user.email)
    .replace('[LOGIN_URL]', 'https://your-app-url.com/login');

  const msg = {
    to: user.email,
    from: 'noreply@edotalenthunt.com',
    subject: 'Your Edo Talent Hunt Account Has Been Activated',
    html: htmlContent,
  };

  await sgMail.send(msg);
}
```

## Security Best Practices

1. ✅ Users must change the default password on first login
2. ✅ Implement password expiration for temporary passwords
3. ✅ Send emails over secure connection (TLS)
4. ✅ Log all activation activities for audit purposes
5. ✅ Consider implementing 2FA for enhanced security

## Verification Checklist

After activation:
- [ ] Run the activation script
- [ ] Verify all accounts show as "Active" in database
- [ ] Send activation emails to all users
- [ ] Test login with at least one account
- [ ] Verify password change functionality works
- [ ] Monitor for any user support requests

## Support

If users experience login issues:
1. Verify their account is marked as `isActive: true`
2. Confirm they're using the correct email address
3. Check if password is correctly set to `EdoTH@2025#Str0ng!`
4. Review application logs for authentication errors

## Default Password

**Password:** `EdoTH@2025#Str0ng!`

**Important:** This is a temporary password. All users MUST change it upon first login.

---

**Generated:** October 18, 2025  
**Status:** Ready for deployment

