import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { User, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { checkUserSubscription } from '@/utils/subscriptionApi';
import { TelegramUser } from '@/types/telegram';

const SimpleTelegramAuth: React.FC = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramWebAppReady, setTelegramWebAppReady] = useState(false);
  const [channelsToCheck] = useState(['@luizahey']); // Список каналов для проверки

  const handleCheckSubscriptions = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const subscriptionsResult: Record<string, boolean> = {};
      
      for (const channelId of channelsToCheck) {
        const isSubscribed = await checkUserSubscription(userId, channelId);
        subscriptionsResult[channelId] = isSubscribed;
      }
      
      setSubscriptions(subscriptionsResult);
    } catch (err) {
      console.error('Ошибка при проверке подписок:', err);
      setError(err instanceof Error ? err.message : 'Ошибка проверки подписок');
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
    console.log('=== ИНИЦИАЛИЗАЦИЯ TELEGRAM AUTH ===');
    
    const initTelegramAuth = async () => {
      await waitForTelegramWebApp();
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('Telegram WebApp найден:', tg);
        
        tg.ready();
        tg.expand();
        
        const initUser: TelegramUser = tg.initDataUnsafe?.user;
        console.log('Данные пользователя из Telegram:', initUser);
        
        if (initUser && initUser.id) {
          setUser(initUser);
          // Сразу проверяем подписки
          handleCheckSubscriptions(initUser.id);
        } else {
          console.warn('Пользователь не найден в Telegram WebApp');
        }
      } else {
        console.warn('Telegram WebApp не доступен');
      }
    };

    initTelegramAuth();
  }, []);

  const handleTelegramLogin = () => {
    console.log('Открываем Telegram Login');
    
    if (!window.Telegram?.WebApp) {
      setError('Telegram WebApp не доступен. Приложение должно запускаться в Telegram.');
      return;
    }

    const tg = window.Telegram.WebApp;
    
    // Создаем URL для Telegram OAuth
    const origin = encodeURIComponent(window.location.origin);
    const loginUrl = `https://oauth.telegram.org/auth?bot_id=YOUR_BOT_ID&origin=${origin}&request_access=write`;
    
    try {
      // Используем метод WebApp для открытия логина
      if (tg.openLoginUrl) {
        tg.openLoginUrl(loginUrl, { request_access: 'write' });
      } else {
        // Fallback для браузера
        window.location.href = loginUrl;
      }
    } catch (err) {
      console.error('Ошибка при открытии Telegram логина:', err);
      setError('Не удалось инициировать вход через Telegram');
    }
  };

  const handleOpenChannel = (channelId: string) => {
    console.log('Открываем канал для подписки:', channelId);
    
    // Создаем URL канала
    const channelUrl = `https://t.me/${channelId.replace('@', '')}`;
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      try {
        // Попробуем использовать openChat если доступен
        if (tg.openChat) {
          tg.openChat(channelId.replace('@', ''));
        } else {
          // Fallback: открываем в новом окне
          window.open(channelUrl, '_blank');
        }
      } catch (err) {
        console.error('Ошибка при открытии канала через WebApp:', err);
        // Fallback: открываем в новом окне
        window.open(channelUrl, '_blank');
      }
    } else {
      // Fallback для браузера
      window.open(channelUrl, '_blank');
    }
  };

  const handleCheckAgain = () => {
    if (user) {
      handleCheckSubscriptions(user.id);
    }
  };

  // Проверяем, есть ли неподписанные каналы
  const hasUnsubscribedChannels = Object.values(subscriptions).some(isSubscribed => !isSubscribed);
  const allChannelsChecked = Object.keys(subscriptions).length === channelsToCheck.length;

  // 1) Если пользователь не найден - показываем кнопку входа
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Вход в приложение</span>
          </CardTitle>
          <CardDescription>
            Для использования приложения необходима авторизация через Telegram
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
            <Button onClick={handleTelegramLogin} className="w-full">
              Войти через Telegram
            </Button>
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

  // 2) Пока проверяем подписки - показываем загрузку
  if (!allChannelsChecked || loading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Проверка подписок</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-lg font-medium">
              Привет, {user.first_name}!
            </p>
            {user.username && (
              <p className="text-sm text-gray-600">@{user.username}</p>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <LoadingSpinner className="h-4 w-4" />
            <span>Проверяем подписки на каналы...</span>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 3) Если есть неподписанные каналы - БЛОКИРУЕМ функционал и требуем подписки
  if (hasUnsubscribedChannels) {
    const unsubscribedChannels = channelsToCheck.filter(channelId => !subscriptions[channelId]);
    
    return (
      <Card className="max-w-md mx-auto mt-8 border-yellow-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <span>Требуются подписки</span>
          </CardTitle>
          <CardDescription>
            Для продолжения работы с приложением
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-lg font-medium">
              Привет, {user.first_name}!
            </p>
            {user.username && (
              <p className="text-sm text-gray-600">@{user.username}</p>
            )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-3">
              <XCircle className="h-5 w-5" />
              <span>Необходимы подписки на каналы</span>
            </div>
            
            <div className="space-y-2 mb-4">
              {unsubscribedChannels.map(channelId => (
                <div key={channelId} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium">{channelId}</span>
                  <Button 
                    onClick={() => handleOpenChannel(channelId)}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Подписаться
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Уже подписались? Проверьте еще раз:
            </p>
            <Button 
              onClick={handleCheckAgain} 
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Проверяем...
                </>
              ) : (
                'Проверить подписки'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4) Если подписан на все каналы - показываем основной интерфейс
  return (
    <Card className="max-w-md mx-auto mt-8 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Добро пожаловать!</span>
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
          <div className="space-y-2">
            {channelsToCheck.map(channelId => (
              <div key={channelId} className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Подписка на {channelId} ✓</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Теперь у вас есть полный доступ к приложению
          </p>
        </div>
        
        {/* Здесь можно добавить основной функционал приложения */}
        <div className="pt-4">
          <p className="text-center text-gray-600">
            🎉 Основной функционал приложения доступен!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTelegramAuth;
