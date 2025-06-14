
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  XCircle,
  Bug
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ConsoleLogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args?: any[];
  stack?: string;
}

export const ConsoleLogs: React.FC = () => {
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);

  useEffect(() => {
    if (!isCapturing) return;

    // Сохраняем оригинальные методы консоли
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Функция для перехвата логов
    const captureLog = (level: ConsoleLogEntry['level']) => {
      return (...args: any[]) => {
        // Вызываем оригинальный метод
        originalConsole[level](...args);

        // Создаем запись лога
        const logEntry: ConsoleLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          level,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          args,
        };

        // Добавляем в наш список логов
        setLogs(prevLogs => {
          const newLogs = [logEntry, ...prevLogs];
          // Ограничиваем количество логов до 500
          return newLogs.slice(0, 500);
        });
      };
    };

    // Перехватываем методы консоли
    console.log = captureLog('log');
    console.info = captureLog('info');
    console.warn = captureLog('warn');
    console.error = captureLog('error');
    console.debug = captureLog('debug');

    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, [isCapturing]);

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleCapturing = () => {
    setIsCapturing(!isCapturing);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-purple-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warn: 'secondary',
      info: 'default',
      debug: 'outline',
      log: 'outline'
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>Консольные логи</span>
            <Badge variant={isCapturing ? 'default' : 'secondary'}>
              {isCapturing ? 'Захват включен' : 'Захват отключен'}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCapturing}
            >
              {isCapturing ? 'Остановить' : 'Запустить'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Очистить
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Всего логов: {logs.length}</span>
            <span>Ошибок: {logs.filter(l => l.level === 'error').length}</span>
            <span>Предупреждений: {logs.filter(l => l.level === 'warn').length}</span>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(log.level)}
                    {getLevelBadge(log.level)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(log.timestamp, 'HH:mm:ss.SSS dd.MM', { locale: ru })}
                  </div>
                </div>
                
                <div className="text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border overflow-x-auto">
                    {log.message}
                  </pre>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <div>Нет консольных логов</div>
                <div className="text-xs mt-1">
                  {isCapturing ? 'Ожидание логов...' : 'Захват логов отключен'}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
