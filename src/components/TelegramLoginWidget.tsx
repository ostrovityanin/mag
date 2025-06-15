
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegramContext } from '@/components/TelegramProvider';

interface TelegramLoginWidgetProps {
  botUsername: string;
  onAuth: (user: any) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  lang?: string;
}

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  botUsername = 'your_bot_username',
  onAuth,
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = true,
  usePic = true,
  lang = 'ru'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetKey, setWidgetKey] = useState(0); // Ключ для принудительного обновления виджета
  const { authenticateUser, isAuthenticated } = useTelegramContext();

  useEffect(() => {
    // Если пользователь уже аутентифицирован, не показываем виджет
    if (isAuthenticated) {
      return;
    }

    // Очищаем контейнер
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Создаем уникальную функцию обратного вызова для каждого рендера
    const callbackName = `telegramLoginCallback_${Date.now()}_${widgetKey}`;
    (window as any)[callbackName] = async (user: any) => {
      console.log('=== TELEGRAM LOGIN WIDGET CALLBACK ===');
      console.log('Получены данные пользователя:', user);
      
      try {
        // Проверяем данные пользователя
        if (!user || !user.id || !user.hash) {
          throw new Error('Недопустимые данные пользователя от Telegram');
        }

        // Аутентифицируем пользователя через наш безопасный метод
        const success = await authenticateUser(user);
        if (success) {
          onAuth(user);
        } else {
          throw new Error('Ошибка аутентификации пользователя');
        }
      } catch (error) {
        console.error('Ошибка в Telegram Login Widget:', error);
      } finally {
        // Очищаем функцию из глобальной области
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      }
    };

    // Создаем скрипт для виджета
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess ? 'write' : '');
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-onauth', callbackName);

    // Добавляем скрипт в контейнер
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    // Очистка при размонтировании
    return () => {
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic, lang, onAuth, authenticateUser, isAuthenticated, widgetKey]);

  // Функция для принудительного обновления виджета
  const refreshWidget = () => {
    setWidgetKey(prev => prev + 1);
  };

  // Если пользователь уже аутентифицирован, не показываем виджет
  if (isAuthenticated) {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Вход через Telegram</CardTitle>
        <CardDescription className="text-center">
          Безопасная аутентификация через официальный Telegram Login Widget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div ref={containerRef} key={widgetKey} />
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Используется официальный API Telegram для безопасной проверки подписок
        </div>
      </CardContent>
    </Card>
  );
};
