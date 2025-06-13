
import React, { useState } from 'react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import SimpleTelegramAuth from '@/components/SimpleTelegramAuth';
import { ZodiacSelector } from '@/components/ui/zodiac-selector';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TreePine, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DruidPage: React.FC = () => {
  const { toast } = useToast();
  const { isAuthenticated, authenticatedUser } = useTelegramContext();
  const { subscriptions, hasUnsubscribedChannels, isLoading: subscriptionsLoading } = useUserSubscriptions();
  
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('horoscope');
  const [isLoading, setIsLoading] = useState(false);
  const [todayHoroscope, setTodayHoroscope] = useState<string | null>(null);
  const [todayFortune, setTodayFortune] = useState<string | null>(null);

  const handleSignSelect = (sign: string) => {
    setSelectedSign(sign);
  };

  const handleGetHoroscope = async () => {
    if (!selectedSign) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHoroscope = `Древние друиды предсказывают для ${selectedSign}: Сегодня звёзды и природные силы объединяются, чтобы принести вам мудрость. Доверьтесь своей интуиции и откройтесь новым возможностям. Энергия земли поддержит ваши начинания.`;
      
      setTodayHoroscope(mockHoroscope);
      
      toast({
        title: "Гороскоп готов!",
        description: "Ваш друидский гороскоп получен.",
      });
    } catch (error) {
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
    setIsLoading(true);
    
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
      
      toast({
        title: "Друидская мудрость!",
        description: "Древние знания открыты.",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить предсказание. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Если пользователь не аутентифицирован или не подписан - показываем SimpleTelegramAuth
  if (!isAuthenticated || !authenticatedUser || subscriptionsLoading || hasUnsubscribedChannels) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TreePine className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Друидские Предсказания
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Древняя мудрость природы
            </p>
          </div>

          <SimpleTelegramAuth />
        </div>
      </div>
    );
  }

  // Если пользователь аутентифицирован и подписан - показываем основное приложение
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Друидские Предсказания
            </h1>
          </div>
          <p className="text-gray-600">
            Добро пожаловать, {authenticatedUser.first_name}! 🌿
          </p>
        </div>

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

          {(todayHoroscope || todayFortune) && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setTodayHoroscope(null);
                  setTodayFortune(null);
                  setSelectedSign(null);
                }}
              >
                Сбросить для демо
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
