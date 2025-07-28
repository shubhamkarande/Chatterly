import { supabase } from '../config/supabase';
import { User } from '../store/slices/authSlice';

export class SupabaseAuthService {
  static async signInWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return await this.createUserProfile(data.user);
  }

  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // The database trigger should handle creating the user profile automatically
    // But let's add a fallback just in case
    setTimeout(async () => {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user!.id,
          email: data.user!.email,
          display_name: displayName,
          is_online: true,
          last_seen: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('Profile creation fallback error:', profileError);
      } else {
        console.log('User profile created/updated successfully');
      }
    }, 1000); // Wait 1 second for trigger to run first

    return await this.createUserProfile(data.user);
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = await this.createUserProfile(session.user);
          callback(user);
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  private static async createUserProfile(supabaseUser: any): Promise<User> {
    // Try to get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (profile) {
      // Update online status when user logs in
      await supabase
        .from('users')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq('id', supabaseUser.id);

      return {
        uid: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        photoURL: profile.avatar_url,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
    }

    // If profile doesn't exist, create it
    const displayName = supabaseUser.user_metadata?.display_name || 
                       supabaseUser.email?.split('@')[0] || 
                       'Anonymous';

    const newProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      display_name: displayName,
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(newProfile);

    if (insertError) {
      console.warn('Failed to create user profile:', insertError);
    }

    return {
      uid: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: displayName,
      photoURL: supabaseUser.user_metadata?.avatar_url,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    };
  }

  static async updateUserStatus(uid: string, isOnline: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', uid);

    if (error) console.warn('Update user status error:', error);
  }

  static async searchUsers(query: string): Promise<User[]> {
    let queryBuilder = supabase
      .from('users')
      .select('*')
      .limit(50);

    // If query is provided, filter by name or email
    if (query && query.trim().length > 0) {
      queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.warn('Search users error:', error);
      return [];
    }

    return (data || []).map(profile => ({
      uid: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      photoURL: profile.avatar_url,
      isOnline: profile.is_online,
      lastSeen: profile.last_seen, // Keep as string
    }));
  }
}