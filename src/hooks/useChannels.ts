
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Channel {
  id: string;
  name: string;
  username: string;
  chat_id: string | null;
  invite_link: string | null;
  created_at: string;
  required: boolean;
  app_name: string;
  channel_type: 'public' | 'private';
}

export const useChannels = (appName?: string) => {
  return useQuery({
    queryKey: ['channels', appName],
    queryFn: async (): Promise<Channel[]> => {
      let query = supabase
        .from('app_channels')
        .select(`
          app,
          required,
          channels (
            id,
            name,
            username,
            chat_id,
            invite_link,
            created_at
          )
        `);
      
      if (appName) {
        query = query.eq('app', appName);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching channels:', error);
        throw error;
      }
      
      if (!data) return [];
      
      const channels: Channel[] = data
        .filter(ac => ac.channels)
        .map(ac => {
          const ch = ac.channels!;
          return ({
            ...ch,
            app_name: ac.app,
            required: ac.required,
            channel_type: (ch.username && ch.username.trim() !== '') ? 'public' : 'private',
          });
        });
      
      return channels.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
  });
};
