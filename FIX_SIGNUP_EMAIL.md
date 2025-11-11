/**
 * FIX: Remove Brevo welcome email from signup
 * 
 * ISSUE: The signup flow was trying to send a welcome email via Brevo's API,
 * but Supabase AUTOMATICALLY sends a confirmation email when a user signs up.
 * 
 * Sending an extra email causes an "unexpected_failure" error because the
 * API call is failing (likely due to configuration issues or timing).
 * 
 * SOLUTION: Remove the welcome email sending code and let Supabase handle
 * the confirmation email naturally.
 * 
 * Changes:
 * 1. Remove the try block that sends welcome email via /api/email/send
 * 2. Remove the contact addition to Brevo
 * 3. Keep only the simple toast notification
 * 4. Let Supabase send the verification email automatically
 */

// In src/contexts/AuthContext.tsx, signUp function:
// REPLACE THIS:
// if (data.user) {
//   try {
//     await fetch('/api/email/send', { ... }); // REMOVE
//     await fetch('/api/email/add-contact', { ... }); // REMOVE
//   } catch (emailError) { ... } // REMOVE
// }

// WITH THIS:
// if (data.user) {
//   toast({
//     title: "Account Created!",
//     description: "Please check your email to verify your account before signing in.",
//   });
//   return;
// }
