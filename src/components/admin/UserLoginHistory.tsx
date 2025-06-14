
import React, { useState, useEffect } from 'react';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UserCheck, 
  Users, 
  Clock, 
  Filter,
  Search,
  Activity,
  LogIn,
  LogOut,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const UserLoginHistory: React.FC = () => {
  const { adminLogs, isLoading, logAdminAction } = useAdminLogs();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTelegram, setSearchTelegram] = useState('');

  // Логируем загрузку истории входов
  useEffect(() => {
    logAdminAction({
      log_type: 'user_load',
      operation: 'load_user_login_history',
      details: {
        page: 'admin',
        section: 'user_login_history',
        timestamp: new Date().toISOString(),
      },
      success: true,
    });
  }, [logAdminAction]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Фильтруем логи пользователей и подписок
  const userLogs = adminLogs.filter(log => 
    ['auth_attempt', 'user_load'].includes(log.log_type) &&
    ['user_login_attempt', 'existing_user_login', 'new_user_registration', 'user_logout', 'session_restored', 'subscription_check_start', 'subscription_check_complete', 'subscription_check_failed'].includes(log.operation)
  );

  // Применяем фильтры
  const filteredLogs = userLogs.filter(log => {
    const matchesType = filterType === 'all' || log.operation.includes(filterType);
    const matchesTelegram = searchTelegram === '' || 
      (log.telegram_user_id && log.telegram_user_id.toString().includes(searchTelegram)) ||
      (log.details?.username && log.details.username.toLowerCase().includes(searchTelegram.toLowerCase()));
    
    return matchesType && matchesTelegram;
  });

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'user_login_attempt':
      case 'existing_user_login':
        return <LogIn className="h-4 w-4" />;
      case 'new_user_registration':
        return <UserPlus className="h-4 w-4" />;
      case 'user_logout':
        return <LogOut className="h-4 w-4" />;
      case 'session_restored':
        return <RefreshCw className="h-4 w-4" />;
      case 'subscription_check_start':
      case 'subscription_check_complete':
      case 'subscription_check_failed':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getOperationColor = (operation: string, success: boolean) => {
    if (!success) return 'bg-red-500 text-white';
    
    switch (operation) {
      case 'new_user_registration':
        return 'bg-green-500 text-white';
      case 'existing_user_login':
        return 'bg-blue-500 text-white';
      case 'user_logout':
        return 'bg-gray-500 text-white';
      case 'session_restored':
        return 'bg-purple-500 text-white';
      case 'subscription_check_complete':
        return 'bg-emerald-500 text-white';
      case 'subscription_check_start':
        return 'bg-yellow-500 text-black';
      case 'subscription_check_failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-indigo-500 text-white';
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  const getOperationTitle = (operation: string) => {
    switch (operation) {
      case 'user_login_attempt':
        return 'Попытка входа';
      case 'existing_user_login':
        return 'Вход пользователя';
      case 'new_user_registration':
        return 'Регистрация';
      case 'user_logout':
        return 'Выход';
      case 'session_restored':
        return 'Восстановление сессии';
      case 'subscription_check_start':
        return 'Начало проверки подписок';
      case 'subscription_check_complete':
        return 'Проверка подписок завершена';
      case 'subscription_check_failed':
        return 'Ошибка проверки подписок';
      default:
        return operation;
    }
  };

  // Статистика
  const totalLogins = userLogs.filter(log => log.operation === 'existing_user_login').length;
  const totalRegistrations = userLogs.filter(log => log.operation === 'new_user_registration').length;
  const totalSubscriptionChecks = userLogs.filter(log => log.operation === 'subscription_check_complete').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">История активности пользователей</h2>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего входов</p>
                <p className="text-2xl font-bold text-blue-600">{totalLogins}</p>
              </div>
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Новых регистраций</p>
                <p className="text-2xl font-bold text-green-600">{totalRegistrations}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Проверок подписок</p>
                <p className="text-2xl font-bold text-purple-600">{totalSubscriptionChecks}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Фильтры</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Тип события:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">Все</option>
                <option value="login">Входы</option>
                <option value="registration">Регистрации</option>
                <option value="logout">Выходы</option>
                <option value="subscription">Подписки</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Поиск по Telegram ID или username"
                value={searchTelegram}
                onChange={(e) => setSearchTelegram(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список логов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>История активности ({filteredLogs.length})</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getOperationIcon(log.operation)}
                      <Badge className={getOperationColor(log.operation, log.success)}>
                        {getOperationTitle(log.operation)}
                      </Badge>
                      {log.telegram_user_id && (
                        <span className="text-sm text-gray-600">
                          ID: {log.telegram_user_id}
                        </span>
                      )}
                      {log.details?.username && (
                        <span className="text-sm text-gray-600">
                          @{log.details.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                  
                  {log.details?.first_name && (
                    <div className="text-sm text-gray-700 mb-1">
                      Имя: {log.details.first_name} {log.details.last_name || ''}
                    </div>
                  )}
                  
                  {log.execution_time_ms && (
                    <div className="text-xs text-gray-500">
                      Время выполнения: {log.execution_time_ms}мс
                    </div>
                  )}
                  
                  {log.error_message && (
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Ошибка: {log.error_message}
                    </div>
                  )}
                  
                  {Object.keys(log.details || {}).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600">
                        Подробности
                      </summary>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Нет записей для отображения
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
