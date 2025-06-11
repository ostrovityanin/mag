
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTelegramContext } from '@/components/TelegramProvider';

export const TelegramLoginButton: React.FC = () => {
  const { user } = useTelegramContext();

  if (user) {
    return null; // Не показываем кнопку если уже залогинен
  }

  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 mb-4">
        Для использования приложения необходимо запустить его в Telegram
      </p>
      <p className="text-xs text-gray-500">
        Данное приложение работает только в среде Telegram WebApp
      </p>
    </div>
  );
};
