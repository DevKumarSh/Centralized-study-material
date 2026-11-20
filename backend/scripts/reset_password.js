const supabase = require('../src/supabase');

/**
 * Script to reset password for a Supabase Auth user.
 * Usage:
 *   node scripts/reset_password.js [email] [new_password]
 * Example:
 *   node scripts/reset_password.js devsharmakumar74@gmail.com Admin@123
 */
async function resetPassword() {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] || 'devsharmakumar74@gmail.com').trim().toLowerCase();
  const newPassword = args[1] || 'Admin@123';

  console.log(`\n======================================================`);
  console.log(`🔐 Resetting password for: ${targetEmail}`);
  console.log(`======================================================`);

  try {
    // 1. Find user in Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing auth users:', listError.message);
      process.exit(1);
    }

    const user = users.find(u => u.email.toLowerCase() === targetEmail);
    if (!user) {
      console.error(`❌ User "${targetEmail}" not found in Supabase Auth.`);
      console.log('Registered emails in project:', users.map(u => u.email));
      process.exit(1);
    }

    console.log(`✓ Found user ID: ${user.id}`);

    // 2. Update password and confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true // Ensure user can log in without email blockade
    });

    if (updateError) {
      console.error('❌ Failed to update password:', updateError.message);
      process.exit(1);
    }

    console.log(`✓ Password updated successfully!`);
    console.log(`✓ Email confirmation verified!`);
    console.log(`\n------------------------------------------------------`);
    console.log(`🎉 NEW LOGIN CREDENTIALS:`);
    console.log(`   Email:    ${targetEmail}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`------------------------------------------------------\n`);
  } catch (err) {
    console.error('❌ Unexpected error resetting password:', err);
    process.exit(1);
  }
}

resetPassword();

