
import React from 'react';
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget';
import { useTelegramWidgetAuth } from '@/hooks/useTelegramWidgetAuth';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTelegramBotUsername } from '@/hooks/useTelegramBotUsername';

export const TelegramLoginButton: React.FC = () => {
  const { user, isAuthenticated } = useTelegramContext();
  const { authenticateWithWidget, isLoading, error } = useTelegramWidgetAuth();
  const { botUsername, isLoading: isBotUsernameLoading, error: botUsernameError } = useTelegramBotUsername();

  const handleTelegramAuth = async (telegramUser: any) => {
    console.log('=== ОБРАБОТКА TELEGRAM AUTH ===');
    console.log('Пользователь от виджета:', telegramUser);
    
    const success = await authenticateWithWidget(telegramUser);
    if (success) {
      console.log('Аутентификация через виджет успешна');
      window.location.reload();
    }
  };

  if (isAuthenticated && user) {
    return null; // Не показываем кнопку если уже залогинен
  }

  if (isLoading || isBotUsernameLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-sm text-gray-600">Проверяем данные аутентификации...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || botUsernameError) {
    return (
      <Card className="max-w-md mx-auto border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 mb-2">Ошибка аутентификации</p>
          <p className="text-xs text-gray-500">
            {error || botUsernameError}
            <br />
            {botUsernameError &&
              " Пожалуйста, настройте переменную TELEGRAM_BOT_USERNAME в настройках проекта Supabase."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Если username получен успешно:
  return (
    <TelegramLoginWidget
      botUsername={botUsername!}
      onAuth={handleTelegramAuth}
      buttonSize="large"
      cornerRadius={10}
      requestAccess={true}
      usePic={true}
      lang="ru"
    />
  );
};
