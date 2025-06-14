
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { User, CheckCircle } from 'lucide-react';
import { TelegramUser } from '@/types/telegram';

const SimpleTelegramAuth: React.FC = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [telegramWebAppReady, setTelegramWebAppReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Ожидание Telegram WebApp (только реальный Telegram!)
  const waitForTelegramWebApp = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkTelegram = () => {
        if (window.Telegram?.WebApp) {
          setTelegramWebAppReady(true);
          resolve();
        } else {
          setTimeout(checkTelegram, 100);
        }
      };
      checkTelegram();
    });
  };

  useEffect(() => {
    const initTelegramAuth = async () => {
      await waitForTelegramWebApp();
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const debug = {
          platform: tg.platform,
          version: tg.version,
          colorScheme: tg.colorScheme,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          initData: tg.initData,
          initDataUnsafe: tg.initDataUnsafe,
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        setDebugInfo(debug);
        tg.ready();
        tg.expand();
        const initUser: TelegramUser = tg.initDataUnsafe?.user;
        if (initUser && initUser.id) {
          setUser(initUser);
        } else {
          setUser(null);
          setError('Пользователь Telegram не найден. Откройте приложение в Telegram WebApp!');
        }
      } else {
        setError('Telegram WebApp не доступен. Запустите приложение внутри Telegram.');
      }
    };
    initTelegramAuth();
  }, []);

  // Если пользователь не найден
  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Диагностика Telegram WebApp</span>
          </CardTitle>
          <CardDescription>
            Требуется запуск в Telegram WebApp (мессенджер Telegram)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!telegramWebAppReady && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <LoadingSpinner className="h-4 w-4" />
              <span>Загрузка Telegram WebApp...</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded text-xs">
            <h4 className="font-semibold mb-2">Отладочная информация:</h4>
            <pre className="whitespace-pre-wrap overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              URL: {window.location.href}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              User Agent: {navigator.userAgent}
            </p>
            <p className="text-xs text-gray-500">
              Это приложение работает только в Telegram WebApp.<br />Запустите через Telegram!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Если всё ок — показ приветствия пользователя
  return (
    <Card className="max-w-md mx-auto mt-8 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Telegram подключен!</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">
            Привет, {user.first_name} {user.last_name || ''}!
          </h3>
          {user.username && (
            <p className="text-sm text-gray-600">@{user.username}</p>
          )}
          <Badge variant="outline" className="mt-2">
            ID: {user.id}
          </Badge>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">
            ✓ Telegram пользователь успешно определён
          </p>
          <p className="text-xs text-green-600 mt-1">
            Теперь будет выполнена проверка подписки на каналы
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTelegramAuth;
