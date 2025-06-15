
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SubscribeScreenProps {
  missingChannels: Array<{
    chat_id: string;
    status: string;
    channel_name?: string;
    invite_link?: string;
  }>;
  onRefresh: () => void;
  isRefreshing: boolean;
  user?: {
    id: number;
    first_name?: string;
    username?: string;
  };
  onOpenChannel: (url: string) => void;
}

export const SubscribeScreen: React.FC<SubscribeScreenProps> = ({
  missingChannels,
  onRefresh,
  isRefreshing,
  user,
  onOpenChannel,
}) => {
  const getChannelUrl = (channel: { chat_id: string; channel_name?: string; invite_link?: string }) => {
    // Если есть invite_link, используем его (для приватных каналов)
    if (channel.invite_link) {
      return channel.invite_link;
    }
    
    // Если есть channel_name (username), формируем публичную ссылку
    if (channel.channel_name && !channel.channel_name.startsWith('-')) {
      const username = channel.channel_name.replace('@', '');
      return `https://t.me/${username}`;
    }
    
    // Для случаев, когда нет ни invite_link, ни username
    return '#';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-yellow-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Требуется подписка</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-medium">
              Привет{user?.first_name ? `, ${user.first_name}` : ''}!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Для доступа к приложению подпишитесь на каналы:
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="space-y-2 mb-4">
              {missingChannels.map((channel, index) => {
                const channelUrl = getChannelUrl(channel);
                const isValidUrl = channelUrl !== '#';
                
                return (
                  <div key={channel.chat_id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">
                      {channel.channel_name || `Канал ${index + 1}`}
                    </span>
                    {isValidUrl ? (
                      <Button 
                        onClick={() => onOpenChannel(channelUrl)}
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Перейти
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Обратитесь к админу
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              После подписки нажмите кнопку для проверки:
            </p>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              size="lg"
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Проверяем...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Проверить подписки
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Просто вернитесь в приложение после подписки — проверка произойдет автоматически
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
