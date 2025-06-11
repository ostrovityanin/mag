
import React, { useState } from 'react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { TelegramLoginButton } from '@/components/TelegramLoginButton';
import { ZodiacSelector } from '@/components/ui/zodiac-selector';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Cookie, Sparkles, TreePine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChannels } from '@/hooks/useChannels';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';

export const DruidPage: React.FC = () => {
  const { user, isAuthenticated, hapticFeedback } = useTelegramContext();
  const { toast } = useToast();
  
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('horoscope');
  const [isLoading, setIsLoading] = useState(false);
  const [todayHoroscope, setTodayHoroscope] = useState<string | null>(null);
  const [todayFortune, setTodayFortune] = useState<string | null>(null);

  // Загружаем каналы для друидского приложения
  const { data: channels = [], isLoading: channelsLoading } = useChannels('druid_horoscope');
  const { 
    data: subscriptionData,
    subscriptions, 
    isChecking, 
    checkSubscription,
    isLoading: subscriptionsLoading 
  } = useUserSubscriptions();

  console.log('=== DRUID PAGE STATE ===');
  console.log('channels:', channels);
  console.log('subscriptions:', subscriptions);
  console.log('isChecking:', isChecking);
  console.log('checkSubscription тип:', typeof checkSubscription);
  console.log('checkSubscription существует:', !!checkSubscription);

  const requiredChannels = channels.filter(c => c.required);
  const allChannelsSubscribed = requiredChannels.length > 0 && requiredChannels.every(c => subscriptions[c.id]);

  // Если пользователь не аутентифицирован, показываем экран входа
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TreePine className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Друидские Предсказания
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Древняя мудрость природы откроет вам тайны будущего
            </p>
          </div>

          {/* Login Screen */}
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <TreePine className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">
                  Добро пожаловать!
                </CardTitle>
                <p className="text-sm text-green-600 mt-2">
                  Войдите, чтобы получить доступ к друидским предсказаниям
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <TelegramLoginButton />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSignSelect = (sign: string) => {
    hapticFeedback.selection();
    setSelectedSign(sign);
  };

  const handleGetHoroscope = async () => {
    if (!selectedSign || !allChannelsSubscribed) return;
    
    setIsLoading(true);
    hapticFeedback.impact('medium');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHoroscope = `Древние друиды предсказывают для ${selectedSign}: Сегодня звёзды и природные силы объединяются, чтобы принести вам мудрость. Доверьтесь своей интуиции и откройтесь новым возможностям. Энергия земли поддержит ваши начинания.`;
      
      setTodayHoroscope(mockHoroscope);
      hapticFeedback.notification('success');
      
      toast({
        title: "Гороскоп готов!",
        description: "Ваш друидский гороскоп получен.",
      });
    } catch (error) {
      hapticFeedback.notification('error');
      toast({
        title: "Ошибка",
        description: "Не удалось получить гороскоп. Попробуйте снова.",
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fortunes = [
        "Как древний дуб растёт медленно, но становится могучим.",
        "Слушай шёпот ветра - он несёт мудрость предков.",
        "Твоя сила в гармонии с природой, не борись с ней.",
        "Каждый восход солнца - новая возможность для роста.",
        "Корни дают силу, но крона тянется к свету."
      ];
      
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      setTodayFortune(randomFortune);
      hapticFeedback.notification('success');
      
      toast({
        title: "Друидская мудрость!",
        description: "Древние знания открыты.",
      });
    } catch (error) {
      hapticFeedback.notification('error');
      toast({
        title: "Ошибка",
        description: "Не удалось получить предсказание. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (channelsLoading || subscriptionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Друидские Предсказания
            </h1>
          </div>
          {user && (
            <p className="text-gray-600">
              Добро пожаловать, {user.first_name}! 🌿
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Древняя мудрость природы откроет вам тайны будущего
          </p>
        </div>

        {/* Subscription Requirements Screen */}
        {!allChannelsSubscribed && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <TreePine className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">
                  Доступ к древней мудрости
                </CardTitle>
                <p className="text-sm text-green-600 mt-2">
                  Для получения друидских предсказаний необходимо подписаться на наши каналы
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {requiredChannels.length > 0 ? (
                  <ChannelRequirement
                    channels={requiredChannels}
                    subscriptions={subscriptions}
                    onCheckSubscription={checkSubscription}
                    isChecking={isChecking}
                  />
                ) : (
                  <div className="text-center py-8">
                    <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Каналы для подписки не настроены.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Обратитесь к администратору для настройки каналов.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Only visible after subscription */}
        {allChannelsSubscribed && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
                <TabsTrigger value="horoscope" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Гороскоп</span>
                </TabsTrigger>
                <TabsTrigger value="fortune" className="flex items-center space-x-2">
                  <TreePine className="h-4 w-4" />
                  <span>Мудрость</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="horoscope" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-green-600" />
                      <span>Друидский Гороскоп</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedSign && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-center">
                          Выберите ваш знак зодиака
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
                          Готовы узнать, что приготовили для вас древние силы природы?
                        </p>
                        <Button
                          onClick={handleGetHoroscope}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Читаю знаки природы...
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Получить Гороскоп
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
                      <TreePine className="h-5 w-5 text-green-600" />
                      <span>Друидская Мудрость</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!todayFortune && (
                      <div className="text-center space-y-4">
                        <p className="text-gray-600">
                          Откройте древнюю мудрость друидов для познания жизни!
                        </p>
                        <Button
                          onClick={handleGetFortune}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Получаю мудрость...
                            </>
                          ) : (
                            <>
                              <TreePine className="h-4 w-4 mr-2" />
                              Получить Мудрость
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
                  Сбросить для демо
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
