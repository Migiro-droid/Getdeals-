# 🔧 Quick Password Reset Test

## Immediate Actions to Try:

### 1. **Check Supabase Dashboard Settings**

Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/auth/url-configuration

**Required Settings:**
- Site URL: `https://getdeals.co.ke`
- Redirect URLs must include: `https://getdeals.co.ke/auth/reset-password`

### 2. **Test in Browser Console**

1. Open your website
2. Press F12 to open DevTools
3. Go to Console tab
4. Paste this code:

```javascript
// Direct test of password reset
async function testPasswordReset(email) {
  try {
    console.log('Testing password reset for:', email);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://getdeals.co.ke/auth/reset-password'
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Full error:', error);
    } else {
      console.log('✅ Success! Check your email (including spam folder)');
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

// Replace with your email
testPasswordReset('your-email@example.com');
```

### 3. **Check Browser Network Tab**

1. Open DevTools > Network tab
2. Try password reset
3. Look for the resetPasswordForEmail API call
4. Check if it returns 200 OK or an error

### 4. **Check Email Thoroughly**

- **Primary inbox**
- **Spam/Junk folder** ⭐ (Most common location)
- **Promotions tab** (Gmail)
- **All Mail** folder (Gmail)

### 5. **Try Different Email**

Test with:
- Gmail account
- Yahoo account  
- Different email provider

### 6. **Rate Limiting Check**

- Wait 1 hour between attempts
- Supabase limits: ~3-4 emails per hour per email address

### 7. **Supabase Logs**

Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/logs/auth-logs

Look for:
- Password reset events
- Error messages
- Rate limiting messages

---

## Most Likely Cause:

🎯 **Missing redirect URL in Supabase configuration**

Make sure `https://getdeals.co.ke/auth/reset-password` is added to your redirect URLs list!