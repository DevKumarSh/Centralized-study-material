const supabase = require('../src/supabase');

async function setAdmin() {
  const targetEmail = 'devsharmakumar74@gmail.com';
  console.log(`Setting role to admin for: ${targetEmail}...`);

  try {
    // 1. List users from Supabase Auth Admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing auth users:', listError.message);
      return;
    }

    const user = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.log(`User ${targetEmail} not found in Supabase Auth users.`);
      console.log('Registered users:', users.map(u => u.email));
      return;
    }

    console.log(`Found Auth User: ID ${user.id}, email: ${user.email}`);

    // 2. Update user metadata & confirm email if unconfirmed
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'admin'
      },
      email_confirm: true // Automatically confirms the email so they can log in immediately!
    });

    if (updateError) {
      console.error('Error updating user in Auth:', updateError.message);
    } else {
      console.log('✓ Successfully updated Auth user metadata to admin and confirmed email!');
    }

    // 3. Update public.profiles if the table exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Dev Kumar',
        role: 'admin'
      })
      .select()
      .maybeSingle();

    if (profileError) {
      console.warn('Note on profiles table:', profileError.message);
      console.log('(Make sure you have executed database/complete_setup.sql in Supabase SQL Editor to create public.profiles)');
    } else {
      console.log('✓ Successfully updated public.profiles row:', profile);
    }

    console.log(`\n🎉 User ${targetEmail} is now an ADMIN!`);
  } catch (err) {
    console.error('Fatal error setting admin:', err);
  }
}

setAdmin();
