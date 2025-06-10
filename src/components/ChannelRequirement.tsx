
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, X } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  username: string;
  invite_link?: string;
  channel_type: string;
  required: boolean;
}

interface ChannelRequirementProps {
  channels: Channel[];
  subscriptions: Record<string, boolean>;
  onCheckSubscription: (channelId: string) => void;
  isChecking: string | null;
}

export const ChannelRequirement: React.FC<ChannelRequirementProps> = ({
  channels,
  subscriptions,
  onCheckSubscription,
  isChecking
}) => {
  const requiredChannels = channels.filter(c => c.required);
  const allSubscribed = requiredChannels.every(c => subscriptions[c.id]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Join Our Channels
        </h3>
        <p className="text-sm text-gray-600">
          To access premium features, please join these channels:
        </p>
      </div>

      <div className="space-y-3">
        {requiredChannels.map((channel) => {
          const isSubscribed = subscriptions[channel.id];
          const isCheckingThis = isChecking === channel.id;
          
          return (
            <Card key={channel.id} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isSubscribed ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <X className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{channel.name}</h4>
                      <p className="text-sm text-gray-500">@{channel.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={channel.channel_type === 'public' ? 'default' : 'secondary'}>
                      {channel.channel_type}
                    </Badge>
                    {!isSubscribed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(channel.invite_link || `https://t.me/${channel.username}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isSubscribed ? "default" : "outline"}
                      onClick={() => onCheckSubscription(channel.id)}
                      disabled={isCheckingThis}
                    >
                      {isCheckingThis ? 'Checking...' : isSubscribed ? 'Verified' : 'Check'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allSubscribed && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">All channels verified!</p>
          <p className="text-green-600 text-sm">You can now access all features.</p>
        </div>
      )}
    </div>
  );
};
