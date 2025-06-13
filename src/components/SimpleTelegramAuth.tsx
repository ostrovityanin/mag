
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { User, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { TelegramUser } from '@/types/telegram';

const SimpleTelegramAuth: React.FC = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramWebAppReady, setTelegramWebAppReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const waitForTelegramWebApp = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkTelegram = () => {
        if (window.Telegram?.WebApp) {
          console.log('Telegram WebApp готов');
          setTelegramWebAppReady(true);
          resolve();
        } else {
          console.log('Ждем загрузки Telegram WebApp...');
          setTimeout(checkTelegram, 100);
        }
      };
      checkTelegram();
    });
  };

  useEffect(() => {
    console.log('=== ИНИЦИАЛИЗАЦИЯ TELEGRAM AUTH ===');
    
    const initTelegramAuth = async () => {
      await waitForTelegramWebApp();
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('Telegram WebApp найден:', tg);
        
        // Собираем отладочную информацию
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
        console.log('Отладочная информация Telegram WebApp:', debug);
        
        tg.ready();
        tg.expand();
        
        const initUser: TelegramUser = tg.initDataUnsafe?.user;
        console.log('Данные пользователя из Telegram:', initUser);
        
        if (initUser && initUser.id) {
          setUser(initUser);
        } else {
          console.warn('Пользователь не найден в Telegram WebApp');
          
          // Для разработки создаем тестового пользователя
          if (process.env.NODE_ENV === 'development') {
            console.log('РЕЖИМ РАЗРАБОТКИ: Создаем тестового пользователя');
            const testUser: TelegramUser = {
              id: 1450383115,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'ru',
              is_bot: false,
            };
            setUser(testUser);
          }
        }
      } else {
        console.warn('Telegram WebApp не доступен');
        setError('Telegram WebApp не доступен. Пожалуйста, откройте приложение в Telegram.');
        
        // Для разработки
        if (process.env.NODE_ENV === 'development') {
          console.log('РЕЖИМ РАЗРАБОТКИ: Создаем тестового пользователя');
          const testUser: TelegramUser = {
            id: 1450383115,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'ru',
            is_bot: false,
          };
          setUser(testUser);
          setTelegramWebAppReady(true);
        }
      }
    };

    initTelegramAuth();
  }, []);

  // 1) Если пользователь не найден - показываем отладочную информацию
  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Диагностика Telegram WebApp</span>
          </CardTitle>
          <CardDescription>
            Проверяем подключение к Telegram
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
              Это приложение должно запускаться в Telegram WebApp
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            ✓ Telegram пользователь успешно определен
          </p>
          <p className="text-xs text-green-600 mt-1">
            Теперь будет выполнена проверка подписок на каналы
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTelegramAuth;
