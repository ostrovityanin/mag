
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTelegramContext } from '@/components/TelegramProvider';

export const TelegramLoginButton: React.FC = () => {
  const { user, authenticateUser } = useTelegramContext();

  const handleTelegramLogin = () => {
    // Для тестирования создаем фейкового пользователя
    const fakeUser = {
      id: 123456789,
      first_name: 'Тестовый',
      last_name: 'Пользователь',
      username: 'testuser',
      language_code: 'ru',
      is_premium: false,
      is_bot: false
    };

    console.log('Логин через Telegram с тестовыми данными:', fakeUser);
    authenticateUser(fakeUser);
  };

  if (user) {
    return null; // Не показываем кнопку если уже залогинен
  }

  return (
    <div className="text-center">
      <Button 
        onClick={handleTelegramLogin}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-lg"
        size="lg"
      >
        📱 Войти через Telegram
      </Button>
      <p className="text-sm text-gray-500 mt-2">
        Для тестирования - создает фейкового пользователя
      </p>
    </div>
  );
};
