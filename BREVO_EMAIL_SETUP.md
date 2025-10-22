# Brevo Email Sending Instructions

## 📧 Setup and Configuration

### Step 1: Add Brevo SMTP Key to .env

Open your `.env` file and add your Brevo SMTP key:

```bash
# Add this line to your .env file
BREVO_SMTP_KEY=your_smtp_key_here
```

**To get your SMTP key:**
1. Go to your Brevo SMTP settings (where you are now)
2. Click on the "edo talent hunt" key
3. Copy the full key value (the one shown as **********CP3FTP)
4. Paste it in the .env file

### Step 2: Install nodemailer (if not already installed)

```bash
npm install nodemailer
```

### Step 3: Update Sender Email (Optional)

In the script `scripts/send-emails-brevo.js`, you may want to update the "from" email address to match your verified Brevo sender:

```javascript
from: '"Edo Talent Hunt" <noreply@edotalenthunt.com>'
```

Change it to your verified domain email if needed.

---

## 🚀 Running the Script

### Send All Emails

```bash
node scripts/send-emails-brevo.js
```

This will:
- ✅ Connect to Brevo SMTP server
- ✅ Send personalized HTML emails to all 7 users
- ✅ Include their unique passwords
- ✅ Wait 1 second between emails (to avoid rate limits)
- ✅ Show a summary of sent/failed emails

---

## 📋 Brevo SMTP Configuration Used

- **Server:** smtp-relay.brevo.com
- **Port:** 587
- **Login:** 99c77c001@smtp-brevo.com
- **Key Name:** edo talent hunt
- **Status:** Active ✅

---

## 📧 Emails to be Sent

1. **evanchenthesurgeon@gmail.com** - Divine Agbonlahor Osawoname
   - Password: MightyHawk364%

2. **classicosonic7@gmail.com** - Divine Agbonlahor Osawoname
   - Password: OceanSwift249&

3. **benardgregory935@gmail.com** - Osayande Uwa Matthew
   - Password: MountainBear517$

4. **lovethowenaze85@gmail.com** - Minloveth Owenaze
   - Password: CrystalNoble365$

5. **omofowaaroma@gmail.com** - Cha Nath
   - Password: ApexCrystal515*

6. **ehizpraize58@gmail.com** - OSEMWENGIE EHIZPRAIZE
   - Password: TigerMighty823&

7. **osasokunrobo1@gmail.com** - Osas Paul
   - Password: TigerPrime540%

---

## ⚠️ Important Notes

1. **Sender Email:** Make sure your sender email is verified in Brevo
2. **Daily Limits:** Check your Brevo plan's daily sending limits
3. **Rate Limiting:** Script includes 1-second delay between emails
4. **Testing:** Consider sending to yourself first to test the format

---

## 🔍 Troubleshooting

### Error: "Invalid login"
- Check that BREVO_SMTP_KEY in .env is correct
- Make sure there are no extra spaces or quotes

### Error: "Sender email not verified"
- Go to Brevo > Settings > Senders
- Verify your sender email address

### Error: "Daily limit exceeded"
- Check your Brevo account limits
- Wait until tomorrow or upgrade your plan

---

## ✅ Quick Start Commands

```bash
# 1. Add SMTP key to .env
echo "BREVO_SMTP_KEY=your_actual_key_here" >> .env

# 2. Install nodemailer if needed
npm install nodemailer

# 3. Send all emails
node scripts/send-emails-brevo.js
```

---

**Created:** October 21, 2025  
**Status:** Ready to send 🚀

