
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const { isLoading, authError } = useTelegramContext();

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

          <div className="space-y-6 h-16 flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 mt-2">Автоматическая аутентификация...</p>
              </div>
            )}
            {authError && (
              <div className="text-red-500 text-sm">
                <p className="font-semibold">Ошибка входа:</p>
                <p className="text-xs mt-1">{authError}</p>
              </div>
            )}
            {!isLoading && !authError && (
               <div className="text-xs text-gray-400">
                 Для доступа к приложению, пожалуйста, откройте его через Telegram.
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
