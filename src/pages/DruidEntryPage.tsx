
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useSubscriptionVerification } from '@/hooks/useSubscriptionVerification';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SubscribeScreen } from "@/components/SubscribeScreen";
import { MysticalLoadingScreen } from "@/components/MysticalLoadingScreen";

export const DruidEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { webApp, user, isLoading: webAppLoading, error: webAppError, openTelegramLink } = useTelegramContext();
  const { 
    result, 
    isLoading: verificationLoading, 
    error: verificationError, 
    refresh,
    isAllowed,
    missingChannels 
  } = useSubscriptionVerification(webApp);

  // Автоматический переход в приложение после успешной проверки подписок
  useEffect(() => {
    if (isAllowed && !verificationLoading && !verificationError) {
      navigate('/druid/app');
    }
  }, [isAllowed, verificationLoading, verificationError, navigate]);

  // Если WebApp ещё загружается
  if (webAppLoading) {
    return <WelcomeScreen onGetStarted={() => {}} />;
  }

  // Если ошибка WebApp или нет пользователя
  if (webAppError || !webApp || !user) {
    return <WelcomeScreen onGetStarted={() => {}} />;
  }

  // Загрузка проверки подписок
  if (verificationLoading) {
    return (
      <MysticalLoadingScreen />
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

  // Если дошли до сюда и доступ разрешен, перенаправляем в приложение
  // (хотя useEffect должен уже это сделать)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-green-600">Перенаправление в приложение...</p>
      </div>
    </div>
  );
};
