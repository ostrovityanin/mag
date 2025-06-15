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

  // --- ДОБАВЛЕНО: сбрасывать widgetKey при изменении isAuthenticated на false (например после logout)
  useEffect(() => {
    if (!isAuthenticated) {
      setWidgetKey(k => k + 1);
    }
    // Не нужен return — это только для инициализации.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    // Если пользователь уже аутентифицирован, не показываем виджет
    if (isAuthenticated) {
      console.log('Пользователь аутентифицирован, скрываем виджет');
      return;
    }

    setError(null);
    setScriptLoaded(false);

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
      scriptRef.current = null;
      console.log('Удалён старый <script> Telegram Widget');
    }

    const callbackName = `telegramLoginCallback_${Date.now()}_${widgetKey}`;
    (window as any)[callbackName] = async (user: any) => {
      try {
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
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      }
    };

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
      setScriptLoaded(true);
    };

    script.onerror = () => {
      setError('Не удалось загрузить Telegram Widget');
    };

    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [
    botUsername,
    buttonSize,
    cornerRadius,
    requestAccess,
    usePic,
    lang,
    onAuth,
    authenticateUser,
    isAuthenticated,
    widgetKey
  ]);

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
