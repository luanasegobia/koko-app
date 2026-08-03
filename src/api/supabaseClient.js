import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to map snake_case base44 entities to Supabase tables
// Some mappings might be needed if table names are different
const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');

export const db = {
  auth: {
    isAuthenticated: async () => {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    },
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // Fetch extra user details from Users table if we had one, or just return user metadata
      return { id: user.id, email: user.email, ...user.user_metadata };
    },
    logout: async (redirectUrl) => {
      await supabase.auth.signOut();
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    },
    loginViaEmailPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    register: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    verifyOtp: async ({ email, otpCode }) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
      if (error) throw error;
      return data;
    },
    resendOtp: async (email) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      return true;
    },
    loginWithProvider: async (provider, redirectUrl) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl || window.location.origin }
      });
      if (error) throw error;
      return data;
    },
    resetPasswordRequest: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return true;
    },
    resetPassword: async ({ newPassword }) => {
      // Assuming user arrives with token in URL hash
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    },
    updateMe: async (data) => {
      const { data: updated, error } = await supabase.auth.updateUser({ data });
      if (error) throw error;
      return updated.user;
    }
  },
  
  entities: new Proxy({}, {
    get: (target, entityName) => {
      const tableName = toSnakeCase(entityName); // e.g. LostPet -> lost_pet
      
      return {
        list: async (orderBy = '-created_at', limit = 100) => {
          const isDesc = orderBy.startsWith('-');
          const col = isDesc ? orderBy.substring(1) : orderBy;
          // Fallback col name since base44 used created_date and supabase usually uses created_at
          const realCol = col === 'created_date' ? 'created_at' : col;
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order(realCol, { ascending: !isDesc })
            .limit(limit);
          if (error) throw error;
          return data || [];
        },
        
        filter: async (queryObj, orderBy = '-created_at', limit = 100) => {
          const isDesc = orderBy.startsWith('-');
          const col = isDesc ? orderBy.substring(1) : orderBy;
          const realCol = col === 'created_date' ? 'created_at' : col;

          let query = supabase.from(tableName).select('*');
          for (const [key, value] of Object.entries(queryObj)) {
            query = query.eq(key, value);
          }
          
          const { data, error } = await query
            .order(realCol, { ascending: !isDesc })
            .limit(limit);
          if (error) throw error;
          return data || [];
        },
        
        get: async (id) => {
          const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
          if (error) throw error;
          return data;
        },
        
        create: async (payload) => {
          const { data, error } = await supabase.from(tableName).insert(payload).select().single();
          if (error) throw error;
          return data;
        },
        
        update: async (id, payload) => {
          const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
          if (error) throw error;
          return data;
        },
        
        delete: async (id) => {
          const { data, error } = await supabase.from(tableName).delete().eq('id', id).select().single();
          if (error) throw error;
          return data;
        },
        
        subscribe: (callback) => {
          const channelId = `public:${tableName}:${Math.random().toString(36).substring(7)}`;
          const channel = supabase.channel(channelId)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
            .subscribe();
            
          return () => {
            supabase.removeChannel(channel);
          };
        }
      };
    }
  }),
  
  integrations: {
    Core: {
      UploadFile: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error } = await supabase.storage.from('public-files').upload(filePath, file);
        if (error) throw error;

        const { data } = supabase.storage.from('public-files').getPublicUrl(filePath);
        return { file_url: data.publicUrl };
      }
    }
  }
};

export default db;