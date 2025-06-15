
import React from 'react';
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget';
import { useTelegramWidgetAuth } from '@/hooks/useTelegramWidgetAuth';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const TelegramLoginButton: React.FC = () => {
  const { user, isAuthenticated } = useTelegramContext();
  const { authenticateWithWidget, isLoading, error } = useTelegramWidgetAuth();

  const handleTelegramAuth = async (telegramUser: any) => {
    console.log('=== ОБРАБОТКА TELEGRAM AUTH ===');
    console.log('Пользователь от виджета:', telegramUser);
    
    const success = await authenticateWithWidget(telegramUser);
    if (success) {
      console.log('Аутентификация через виджет успешна');
      // Перезагружаем страницу для обновления состояния
      window.location.reload();
    }
  };

  if (isAuthenticated && user) {
    return null; // Не показываем кнопку если уже залогинен
  }

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-sm text-gray-600">Проверяем данные аутентификации...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 mb-2">Ошибка аутентификации</p>
          <p className="text-xs text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TelegramLoginWidget
      botUsername="your_bot_username" // TODO: Заменить на реальный username бота
      onAuth={handleTelegramAuth}
      buttonSize="large"
      cornerRadius={10}
      requestAccess={true}
      usePic={true}
      lang="ru"
    />
  );
};
