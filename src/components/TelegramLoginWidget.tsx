
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegramContext } from '@/components/TelegramProvider';
import { AlertCircle } from 'lucide-react';

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
  const [widgetKey, setWidgetKey] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticateUser, isAuthenticated } = useTelegramContext();

  // Держим ref на текущий <script> для корректного удаления
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  console.log('=== TelegramLoginWidget RENDER ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('botUsername:', botUsername);
  console.log('widgetKey:', widgetKey);

  useEffect(() => {
    // Если пользователь уже аутентифицирован, не показываем виджет
    if (isAuthenticated) {
      console.log('Пользователь аутентифицирован, скрываем виджет');
      return;
    }

    console.log('=== ЗАГРУЗКА TELEGRAM WIDGET ===');
    setError(null);
    setScriptLoaded(false);

    // Очищаем контейнер кнопки
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Удаляем предыдущий скрипт если был
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
      scriptRef.current = null;
      console.log('Удалён старый <script> Telegram Widget');
    }

    // Создаем уникальный callback для этого рендера
    const callbackName = `telegramLoginCallback_${Date.now()}_${widgetKey}`;
    console.log('Создаем callback:', callbackName);

    (window as any)[callbackName] = async (user: any) => {
      console.log('=== TELEGRAM LOGIN WIDGET CALLBACK ===');
      console.log('Получены данные пользователя:', user);

      try {
        // Проверяем данные пользователя
        if (!user || !user.id || !user.hash) {
          throw new Error('Недопустимые данные пользователя от Telegram');
        }

        const success = await authenticateUser(user);
        if (success) {
          onAuth(user);
        } else {
          throw new Error('Ошибка аутентификации пользователя');
        }
      } catch (error) {
        console.error('Ошибка в Telegram Login Widget:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        // Очищаем функцию из глобального scope
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      }
    };

    // Создаём скрипт для виджета
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

    script.onload = () => {
      console.log('Скрипт Telegram Widget загружен успешно');
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('Ошибка загрузки скрипта Telegram Widget');
      setError('Не удалось загрузить Telegram Widget');
    };

    // Добавляем скрипт в контейнер и сохраняем ref
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptRef.current = script;
      console.log('Скрипт добавлен в контейнер');
    }

    // Очистка при размонтировании или при смене любых props
    return () => {
      // Очищаем контейнер
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      // Очищаем callback
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
      // Удаляем предыдущий скрипт
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
        console.log('Удалён <script> Telegram Widget при cleanup');
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic, lang, onAuth, authenticateUser, isAuthenticated, widgetKey]);

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
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ошибка</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div ref={containerRef} key={widgetKey} />
        </div>

        {!scriptLoaded && !error && (
          <div className="text-center text-xs text-gray-500 mb-2">
            Загружаем виджет входа...
          </div>
        )}

        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Используется официальный API Telegram для безопасной проверки подписок</div>
          <div className="text-blue-600">
            Отладка: botUsername={botUsername}, scriptLoaded={scriptLoaded ? 'да' : 'нет'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
