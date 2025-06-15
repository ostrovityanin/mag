
import React from 'react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useSubscriptionVerification } from '@/hooks/useSubscriptionVerification';
import { UserInfoHeader } from '@/components/UserInfoHeader';
import { AlertTriangle, TreePine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DruidHoroscopeCalculator } from "@/components/DruidHoroscopeCalculator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SubscribeScreen } from "@/components/SubscribeScreen";
import { MysticalLoadingScreen } from "@/components/MysticalLoadingScreen";

export const DruidPage: React.FC = () => {
  const { webApp, user, isLoading: webAppLoading, error: webAppError, openTelegramLink } = useTelegramContext();
  const { 
    result, 
    isLoading: verificationLoading, 
    error: verificationError, 
    refresh,
    progress,
    currentChannel,
    isAllowed,
    missingChannels 
  } = useSubscriptionVerification(webApp);

  // Если WebApp ещё загружается
  if (webAppLoading) {
    return <WelcomeScreen onGetStarted={() => {}} />;
  }

  // Если ошибка WebApp или нет пользователя
  if (webAppError || !webApp || !user) {
    return <WelcomeScreen onGetStarted={() => {}} />;
  }

  // Загрузка проверки подписок с мистическим прогресс-баром
  if (verificationLoading) {
    return (
      <MysticalLoadingScreen 
        progress={progress}
        currentChannel={currentChannel}
      />
    );
  }

  // Ошибка проверки подписок
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка проверки подписок</h2>
            <p className="text-gray-600 mb-4">{verificationError}</p>
            <button 
              onClick={refresh}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Попробовать снова
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Требуются подписки (показываем только первые два канала)
  if (!isAllowed && missingChannels.length > 0) {
    return (
      <SubscribeScreen
        missingChannels={missingChannels}
        onRefresh={refresh}
        isRefreshing={verificationLoading}
        user={result?.user}
        onOpenChannel={openTelegramLink}
      />
    );
  }

  // Основной контент - доступ разрешен
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-6">
        <UserInfoHeader />
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Друидские Предсказания
            </h1>
          </div>
        </div>
        
        <DruidHoroscopeCalculator />
      </div>
    </div>
  );
};
