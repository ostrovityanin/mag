
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertCircle, LogIn, RefreshCw } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const { webApp, isLoading, isAuthLoading, authError, authenticateUser } = useTelegramContext();
  const [manualAuthError, setManualAuthError] = useState<string | null>(null);

  const handleManualLogin = async () => {
    if (!webApp?.initData) {
      setManualAuthError('Данные Telegram WebApp недоступны');
      return;
    }

    setManualAuthError(null);

    try {
      console.log('Начинаем ручную аутентификацию...');
      const success = await authenticateUser(webApp.initData);
      if (!success) {
        setManualAuthError('Не удалось войти в систему');
      }
    } catch (error) {
      console.error('Ошибка при ручной аутентификации:', error);
      setManualAuthError(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  const handleRetry = () => {
    setManualAuthError(null);
    window.location.reload();
  };

  const canLogin = webApp && webApp.initData && !isLoading && !isAuthLoading;
  const hasError = authError || manualAuthError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔮 Друид Гороскопов
            </h1>
            <p className="text-gray-600">
              Добро пожаловать в мистический мир предсказаний
            </p>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <LoadingSpinner />
                <p className="text-sm text-gray-500">Инициализация Telegram WebApp...</p>
              </div>
            )}

            {hasError && (
              <div className="flex flex-col items-center space-y-2 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div className="text-red-600 text-sm text-center">
                  <p className="font-semibold">Ошибка:</p>
                  <p className="text-xs mt-1">{hasError}</p>
                </div>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              </div>
            )}

            {canLogin && (
              <div className="space-y-3">
                <Button
                  onClick={handleManualLogin}
                  disabled={isAuthLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isAuthLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Вход в систему...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Войти через Telegram
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  Нажмите для входа в приложение через Telegram WebApp
                </p>
              </div>
            )}

            {!webApp && !isLoading && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700 text-sm text-center">
                  Приложение должно быть запущено в Telegram
                </p>
                <p className="text-yellow-600 text-xs mt-1 text-center">
                  Откройте приложение через бота в Telegram
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
