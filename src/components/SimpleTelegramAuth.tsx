
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { checkUserSubscription } from '@/utils/subscriptionApi';
import { TelegramUser } from '@/types/telegram';

const SimpleTelegramAuth: React.FC = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramWebAppReady, setTelegramWebAppReady] = useState(false);

  const CHANNEL_ID = '@luizahey'; // Канал для проверки подписки

  const handleCheckSubscription = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const isSubscribed = await checkUserSubscription(userId, CHANNEL_ID);
      setSubscribed(isSubscribed);
    } catch (err) {
      console.error('Ошибка при проверке подписки:', err);
      setError(err instanceof Error ? err.message : 'Ошибка проверки подписки');
    } finally {
      setLoading(false);
    }
  };

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
    console.log('=== ИНИЦИАЛИЗАЦИЯ ПРОСТОЙ TELEGRAM AUTH ===');
    
    const initTelegramAuth = async () => {
      // Ждем загрузки Telegram WebApp SDK
      await waitForTelegramWebApp();
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('Telegram WebApp найден:', tg);
        
        // Инициализируем WebApp
        tg.ready();
        tg.expand();
        
        const initUser: TelegramUser = tg.initDataUnsafe?.user;
        console.log('Данные пользователя из Telegram:', initUser);
        
        if (initUser && initUser.id) {
          setUser(initUser);
          handleCheckSubscription(initUser.id);
        } else {
          console.warn('Пользователь не найден в Telegram WebApp');
        }
      } else {
        console.warn('Telegram WebApp не доступен');
      }
    };

    initTelegramAuth();
  }, []);

  const handleRefreshData = () => {
    console.log('Обновление данных пользователя');
    
    if (!window.Telegram?.WebApp) {
      setError('Telegram WebApp не доступен. Приложение должно запускаться в Telegram.');
      return;
    }

    const tg = window.Telegram.WebApp;
    const initUser: TelegramUser = tg.initDataUnsafe?.user;
    
    if (initUser && initUser.id) {
      setUser(initUser);
      handleCheckSubscription(initUser.id);
      setError(null);
    } else {
      setError('Не удалось получить данные пользователя из Telegram');
    }
  };

  const handleManualCheck = () => {
    if (user) {
      handleCheckSubscription(user.id);
    }
  };

  const renderSubscriptionStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <LoadingSpinner className="h-4 w-4" />
          <span>Проверка подписки...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Ошибка: {error}</span>
        </div>
      );
    }

    if (subscribed === null) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span>Подписка не проверена</span>
        </div>
      );
    }

    return subscribed ? (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Вы подписаны на канал</span>
      </div>
    ) : (
      <div className="flex items-center space-x-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span>Вы не подписаны на канал</span>
      </div>
    );
  };

  // Если пользователь не найден - показываем информацию
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Telegram WebApp</span>
          </CardTitle>
          <CardDescription>
            Приложение для работы в среде Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!telegramWebAppReady && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <LoadingSpinner className="h-4 w-4" />
              <span>Загрузка Telegram WebApp...</span>
            </div>
          )}
          
          {telegramWebAppReady && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-600">
                Данные пользователя не найдены
              </p>
              <Button onClick={handleRefreshData} variant="outline" className="w-full">
                Обновить данные
              </Button>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            Это приложение работает только в среде Telegram WebApp
          </p>
        </CardContent>
      </Card>
    );
  }

  // Показываем информацию о пользователе и статус подписки
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Профиль пользователя</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">
            Привет, {user.first_name} {user.last_name || ''}
          </h3>
          {user.username && (
            <p className="text-sm text-gray-600">@{user.username}</p>
          )}
          <Badge variant="outline" className="mt-2">
            ID: {user.id}
          </Badge>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Статус подписки на канал:</h4>
          {renderSubscriptionStatus()}
          
          <Button 
            onClick={handleManualCheck} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="mt-3 w-full"
          >
            Проверить подписку заново
          </Button>
        </div>
        
        {!subscribed && subscribed !== null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Подпишитесь на канал {CHANNEL_ID} для полного доступа к приложению
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleTelegramAuth;
