
import React, { useState, useEffect } from 'react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ZodiacSelector } from '@/components/ui/zodiac-selector';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Cookie, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChannels } from '@/hooks/useChannels';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';

export const HomePage: React.FC = () => {
  const { user, hapticFeedback } = useTelegramContext();
  const { toast } = useToast();
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('horoscope');
  const [isLoading, setIsLoading] = useState(false);
  const [todayHoroscope, setTodayHoroscope] = useState<string | null>(null);
  const [todayFortune, setTodayFortune] = useState<string | null>(null);

  // Используем настоящие хуки вместо локального состояния
  const { data: channels = [], isLoading: channelsLoading } = useChannels('astro_cookie');
  const { subscriptions, checkingChannel, checkSubscription } = useUserSubscriptions();

  const allChannelsSubscribed = channels.filter(c => c.required).every(c => subscriptions[c.id]);

  const handleGetStarted = () => {
    hapticFeedback.impact('light');
    setShowWelcome(false);
  };

  const handleSignSelect = (sign: string) => {
    hapticFeedback.selection();
    setSelectedSign(sign);
  };

  const handleGetHoroscope = async () => {
    if (!selectedSign || !allChannelsSubscribed) return;
    
    setIsLoading(true);
    hapticFeedback.impact('medium');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHoroscope = `Today brings exciting opportunities for ${selectedSign}. The stars align to bring you clarity in personal matters. Trust your intuition and embrace new beginnings. A chance encounter may lead to meaningful connections.`;
      
      setTodayHoroscope(mockHoroscope);
      hapticFeedback.notification('success');
      
      toast({
        title: "Horoscope Ready!",
        description: "Your daily horoscope has been generated.",
      });
    } catch (error) {
      hapticFeedback.notification('error');
      toast({
        title: "Error",
        description: "Failed to get your horoscope. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFortune = async () => {
    if (!allChannelsSubscribed) return;
    
    setIsLoading(true);
    hapticFeedback.impact('medium');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fortunes = [
        "A journey of a thousand miles begins with a single step.",
        "Your future is created by what you do today, not tomorrow.",
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "Believe you can and you're halfway there.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts."
      ];
      
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      setTodayFortune(randomFortune);
      hapticFeedback.notification('success');
      
      toast({
        title: "Fortune Cookie Opened!",
        description: "Your daily wisdom awaits.",
      });
    } catch (error) {
      hapticFeedback.notification('error');
      toast({
        title: "Error",
        description: "Failed to get your fortune. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSubscription = (channelId: string, username: string) => {
    checkSubscription(channelId, username);
  };

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  if (channelsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Astro Cookie
            </h1>
          </div>
          {user && (
            <p className="text-gray-600">
              Welcome, {user.first_name}! ✨
            </p>
          )}
        </div>

        {/* Channel Requirements */}
        {channels.length > 0 && !allChannelsSubscribed && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <ChannelRequirement
                channels={channels}
                subscriptions={subscriptions}
                onCheckSubscription={handleCheckSubscription}
                isChecking={checkingChannel}
              />
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {(channels.length === 0 || allChannelsSubscribed) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
              <TabsTrigger value="horoscope" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Horoscope</span>
              </TabsTrigger>
              <TabsTrigger value="fortune" className="flex items-center space-x-2">
                <Cookie className="h-4 w-4" />
                <span>Fortune</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="horoscope" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    <span>Daily Horoscope</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedSign && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-center">
                        Select Your Zodiac Sign
                      </h3>
                      <ZodiacSelector
                        selectedSign={selectedSign}
                        onSignSelect={handleSignSelect}
                      />
                    </div>
                  )}
                  
                  {selectedSign && !todayHoroscope && (
                    <div className="text-center space-y-4">
                      <p className="text-gray-600">
                        Ready to discover what the stars have in store for you today?
                      </p>
                      <Button
                        onClick={handleGetHoroscope}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Reading the Stars...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Get My Horoscope
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {todayHoroscope && selectedSign && (
                <HoroscopeCard
                  zodiacSign={selectedSign}
                  content={todayHoroscope}
                  date={new Date().toISOString()}
                />
              )}
            </TabsContent>

            <TabsContent value="fortune" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cookie className="h-5 w-5 text-amber-600" />
                    <span>Fortune Cookie</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!todayFortune && (
                    <div className="text-center space-y-4">
                      <p className="text-gray-600">
                        Crack open your daily fortune cookie for a dose of wisdom!
                      </p>
                      <Button
                        onClick={handleGetFortune}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Opening Cookie...
                          </>
                        ) : (
                          <>
                            <Cookie className="h-4 w-4 mr-2" />
                            Get My Fortune
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {todayFortune && (
                <FortuneCard
                  content={todayFortune}
                  date={new Date().toISOString()}
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Reset Button for Demo */}
        {(todayHoroscope || todayFortune) && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => {
                setTodayHoroscope(null);
                setTodayFortune(null);
                setSelectedSign(null);
                hapticFeedback.impact('light');
              }}
            >
              Reset for Demo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
