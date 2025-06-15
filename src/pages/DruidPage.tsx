import React from 'react';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import SimpleTelegramAuth from '@/components/SimpleTelegramAuth';
import { UserInfoHeader } from '@/components/UserInfoHeader';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TreePine, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DruidHoroscopeCalculator } from "@/components/DruidHoroscopeCalculator";

export const DruidPage: React.FC = () => {
  // Хак для "демо" — определяем, включён ли демо-режим по query-параметру ?demo=1
  const [isDemo, setIsDemo] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsDemo(params.get("demo") === "1");
    }
  }, []);

  const { toast } = useToast();
  const { isAuthenticated, authenticatedUser } = useTelegramContext();
  const subscriptionCheck = useUserSubscriptions('druid');

  // Демо данные (никогда не используются для настоящих пользователей!)
  const DEMO_USER = { first_name: "Демо", last_name: "Пользователь", username: "demo_user" };
  const DEMO_SUBSCRIPTION = {
    isLoading: false,
    error: null,
    data: { hasUnsubscribedChannels: false, missingChannels: [], debugInfo: {} },
    isFetching: false,
    refetch: () => {},
  };

  // Дальше всё стандартно, но если isDemo=true, используем "фейковые" данные
  const currentIsAuthenticated = isDemo ? true : isAuthenticated;
  const currentAuthenticatedUser = isDemo ? DEMO_USER : authenticatedUser;
  const currentSubscriptionCheck = isDemo ? DEMO_SUBSCRIPTION : subscriptionCheck;

  if (!currentIsAuthenticated) {
    return <SimpleTelegramAuth />;
  }

  if (currentSubscriptionCheck.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-lg">Проверяем подписки...</p>
        </div>
      </div>
    );
  }

  if (currentSubscriptionCheck.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center p-4 w-full max-w-2xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Ошибка проверки подписок</p>
          <p className="text-sm text-gray-600 mb-4">{currentSubscriptionCheck.error.message || 'Неизвестная ошибка'}</p>
          <Button onClick={() => currentSubscriptionCheck.refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
          <div className="mt-6 text-left bg-red-50 border border-red-200 rounded p-4 text-xs max-h-72 overflow-auto">
            <div className="mb-2 font-semibold">DebugInfo:</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(currentSubscriptionCheck.data?.debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  const hasUnsubscribedChannels = currentSubscriptionCheck.data?.hasUnsubscribedChannels || false;
  const missingChannels = currentSubscriptionCheck.data?.missingChannels || [];
  const debugInfo = currentSubscriptionCheck.data?.debugInfo;

  if (hasUnsubscribedChannels) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Показываем информацию о пользователе даже при отсутствии подписок */}
          {!isDemo && <UserInfoHeader />}
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TreePine className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Друидские Предсказания
              </h1>
            </div>
          </div>
          
          <Card className="max-w-md mx-auto border-yellow-200 mb-4">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                <span>Требуются подписки</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-medium">
                  Привет, {currentAuthenticatedUser?.first_name}!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Для доступа подпишитесь на каналы:
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="space-y-2 mb-4">
                  {missingChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{channel.username || channel.name}</span>
                      <Button 
                        onClick={() => {
                          const channelUrl = `https://t.me/${channel.username?.replace('@', '') || channel.name}`;
                          window.open(channelUrl, '_blank');
                        }}
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Перейти
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
                  onClick={() => currentSubscriptionCheck.refetch()}
                  disabled={currentSubscriptionCheck.isFetching}
                  size="lg"
                  className="w-full"
                >
                  {currentSubscriptionCheck.isFetching ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Проверяем...
                    </>
                  ) : (
                    'Проверить подписки'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-2xl mt-2">
            <details className="bg-gray-50 rounded border px-4 py-2">
              <summary className="cursor-pointer font-semibold text-gray-600 mb-2">
                Отладочная информация по подписочному блоку
              </summary>
              <div>
                <div className="text-[13px] text-gray-600 mb-1">
                  <b>Входящий пользователь:</b>
                </div>
                <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-2">
                  {JSON.stringify(debugInfo?.authenticatedUser || {}, null, 2)}
                </pre>
                <div className="text-[13px] text-gray-600 mb-1">
                  <b>Полный список каналов для app:</b>
                </div>
                <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-2">
                  {JSON.stringify(debugInfo?.channels || [], null, 2)}
                </pre>
                <div className="text-[13px] text-gray-600 mb-1">
                  <b>Идентификаторы для Edge Function:</b>
                </div>
                <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-2">
                  {JSON.stringify(debugInfo?.channelIdentifiers || [], null, 2)}
                </pre>
                <div className="text-[13px] text-gray-600 mb-1">
                  <b>Ответ Edge Function:</b>
                </div>
                <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-2">
                  {JSON.stringify(debugInfo?.checkResult || {}, null, 2)}
                </pre>
                <div className="text-[13px] text-gray-600 mb-1">
                  <b>Каналы, по которым требуется подписка:</b>
                </div>
                <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-2">
                  {JSON.stringify(debugInfo?.missingChannels || [], null, 2)}
                </pre>
                {debugInfo?.thrownError && (
                  <>
                    <div className="text-[13px] text-red-700 mt-1">
                      <b>Ошибка в процессе:</b>
                    </div>
                    <pre className="bg-white p-2 rounded border text-xs overflow-x-auto mb-1">
                      {JSON.stringify(debugInfo.thrownError, null, 2)}
                    </pre>
                  </>
                )}
                <div className="text-[13px] text-gray-500 mt-1 mb-2">
                  Тайминги: <pre className="inline">{JSON.stringify(debugInfo?.times || {}, null, 2)}</pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // --- ОСНОВНОЙ КОНТЕНТ: только калькулятор, всё что ниже — удалено!
  if (!hasUnsubscribedChannels) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-6">
          {/* Показываем информацию о пользователе в верхней части */}
          {!isDemo && <UserInfoHeader />}
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TreePine className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Друидские Предсказания
              </h1>
            </div>
          </div>
          {/* Только калькулятор! */}
          <DruidHoroscopeCalculator />
        </div>
      </div>
    );
  }

  // --- Если никакое условие выше не выполнено — дефолтно ничего не выводим
  return null;
};
