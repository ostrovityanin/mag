
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TelegramLoginButton } from '@/components/TelegramLoginButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
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

          <div className="space-y-6">
            <TelegramLoginButton />
            
            <div className="text-xs text-gray-400">
              Войдите, чтобы получить доступ к гороскопам и предсказаниям
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
