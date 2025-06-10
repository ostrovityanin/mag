
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Channel {
  id: string;
  name: string;
  username: string;
  chat_id?: string;
  invite_link?: string;
  channel_type: string;
  required: boolean;
  app_name: string;
  created_at: string;
}

export const useChannels = (appName?: string) => {
  return useQuery({
    queryKey: ['channels', appName],
    queryFn: async (): Promise<Channel[]> => {
      let query = supabase.from('required_channels').select('*');
      
      if (appName) {
        query = query.or(`app_name.eq.${appName},app_name.eq.both`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching channels:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};
