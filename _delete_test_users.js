import { supabaseAdmin } from './server/supabase.js';

async function deleteUsers() {
    const names = ['Jennie', 'Jennie2', 'mike', 'susan', 'David'];
    console.log('Searching for users by name:', names);
    
    try {
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, name')
            .in('name', names);
            
        if (fetchError) {
            console.error('Error fetching profiles:', fetchError.message);
            return;
        }
        
        if (!profiles || profiles.length === 0) {
            console.log('No matching users found in profiles table.');
            return;
        }
        
        console.log(`Found ${profiles.length} profiles to delete.`);
        
        for (const profile of profiles) {
            console.log(`Deleting user: ${profile.name} (ID: ${profile.id})`);
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
            if (deleteError) {
                console.error(`Failed to delete user account for ${profile.name}:`, deleteError.message);
            } else {
                console.log(`Successfully deleted auth user and profile for ${profile.name}`);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

deleteUsers().then(() => console.log('Cleanup finished.'));
