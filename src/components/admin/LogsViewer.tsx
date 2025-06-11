
import React, { useState } from 'react';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  Clock,
  User,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const LogsViewer: React.FC = () => {
  const { adminLogs, securityEvents, isLoading } = useAdminLogs();
  const [selectedTab, setSelectedTab] = useState('admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'user_load':
        return 'bg-blue-500 text-white';
      case 'auth_attempt':
        return 'bg-purple-500 text-white';
      case 'filter_action':
        return 'bg-indigo-500 text-white';
      case 'data_query':
        return 'bg-emerald-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Activity className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Системные логи</h2>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Админ-логи ({adminLogs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>События безопасности ({securityEvents.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Логи администрирования</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getLogTypeColor(log.log_type)}>
                            {log.log_type}
                          </Badge>
                          <span className="font-medium">{log.operation}</span>
                          {!log.success && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {log.user_count !== null && (
                          <div>Пользователей: {log.user_count}</div>
                        )}
                        {log.filtered_count !== null && (
                          <div>Отфильтровано: {log.filtered_count}</div>
                        )}
                        {log.telegram_user_id && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Telegram ID: {log.telegram_user_id}</span>
                          </div>
                        )}
                        {log.execution_time_ms && (
                          <div>Время выполнения: {log.execution_time_ms}мс</div>
                        )}
                        {log.error_message && (
                          <div className="text-red-600 font-medium">
                            Ошибка: {log.error_message}
                          </div>
                        )}
                      </div>
                      
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
                  
                  {adminLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Нет записей в логах
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>События безопасности</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(event.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {event.description}
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {event.telegram_user_id && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Telegram ID: {event.telegram_user_id}</span>
                          </div>
                        )}
                        {event.blocked_action && (
                          <div className="text-red-600">
                            Заблокированное действие: {event.blocked_action}
                          </div>
                        )}
                      </div>
                      
                      {Object.keys(event.context || {}).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600">
                            Контекст
                          </summary>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(event.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                  
                  {securityEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Нет событий безопасности
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
