
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const { isLoading, error } = useTelegramContext();

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

            {error && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700 text-sm text-center">
                  {error}
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
