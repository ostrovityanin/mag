
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget';
import { useTelegramWidgetAuth } from '@/hooks/useTelegramWidgetAuth';

const SimpleTelegramAuth: React.FC = () => {
  const { authenticatedUser, isAuthenticated, isLoading: contextLoading } = useTelegramContext();
  const { authenticateWithWidget, isLoading: authLoading } = useTelegramWidgetAuth();

  console.log('=== SimpleTelegramAuth RENDER ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('authenticatedUser:', authenticatedUser);
  console.log('contextLoading:', contextLoading);
  console.log('authLoading:', authLoading);

  const handleTelegramAuth = async (telegramUser: any) => {
    console.log('=== ОБРАБОТКА TELEGRAM AUTH В SimpleTelegramAuth ===');
    console.log('Пользователь от виджета:', telegramUser);
    
    const success = await authenticateWithWidget(telegramUser);
    if (success) {
      console.log('Аутентификация через виджет успешна');
    }
  };

  // Показываем загрузку если контекст или аутентификация загружаются
  if (contextLoading || authLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Загрузка...</p>
          <p className="text-xs text-gray-400 mt-2">
            contextLoading: {contextLoading ? 'да' : 'нет'}, authLoading: {authLoading ? 'да' : 'нет'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Если пользователь НЕ аутентифицирован, показываем виджет входа
  if (!isAuthenticated || !authenticatedUser) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        {/* Отладочная информация */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-xs text-blue-600">
              <div>Состояние аутентификации: {isAuthenticated ? 'да' : 'нет'}</div>
              <div>Пользователь: {authenticatedUser ? 'есть' : 'нет'}</div>
              <div>URL: {window.location.href}</div>
            </div>
          </CardContent>
        </Card>

        {/* Виджет входа */}
        <TelegramLoginWidget
          botUsername="your_bot_username"
          onAuth={handleTelegramAuth}
          buttonSize="large"
          cornerRadius={10}
          requestAccess={true}
          usePic={true}
          lang="ru"
        />
        
        {/* Информация о безопасности */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-700 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Безопасная аутентификация</span>
            </div>
            <p className="text-xs text-blue-600">
              Используется официальный Telegram Login Widget API для безопасной проверки подписок
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если пользователь аутентифицирован, показываем приветствие
  return (
    <Card className="max-w-md mx-auto border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Аутентификация успешна!</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">
            Привет, {authenticatedUser.first_name} {authenticatedUser.last_name || ''}!
          </h3>
          {authenticatedUser.username && (
            <p className="text-sm text-gray-600">@{authenticatedUser.username}</p>
          )}
          <Badge variant="outline" className="mt-2">
            ID: {authenticatedUser.telegram_id}
          </Badge>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-700 mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Безопасно верифицирован</span>
          </div>
          <p className="text-xs text-green-600">
            Данные проверены через официальный Telegram Login Widget API
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTelegramAuth;
