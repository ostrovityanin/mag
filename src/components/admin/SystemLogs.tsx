
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SystemLog {
  id: string;
  level: string;
  message: string;
  context: any;
  function_name: string;
  user_id: string;
  created_at: string;
}

export const SystemLogs: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [functionFilter, setFunctionFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['system-logs', levelFilter, functionFilter],
    queryFn: async (): Promise<SystemLog[]> => {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }

      if (functionFilter !== 'all') {
        query = query.eq('function_name', functionFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default'
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const uniqueFunctions = [...new Set(logs.map(log => log.function_name))].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Системные логи</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={functionFilter} onValueChange={setFunctionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Функция" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все функции</SelectItem>
              {uniqueFunctions.map(func => (
                <SelectItem key={func} value={func}>
                  {func}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Уровень</TableHead>
                <TableHead className="w-[150px]">Время</TableHead>
                <TableHead className="w-[180px]">Функция</TableHead>
                <TableHead>Сообщение</TableHead>
                <TableHead className="w-[100px]">Пользователь</TableHead>
                <TableHead className="w-[100px]">Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(log.level)}
                        {getLevelBadge(log.level)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), 'dd.MM HH:mm:ss', { locale: ru })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.function_name || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_id ? (
                        <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                          {log.user_id.slice(0, 8)}...
                        </code>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {log.context && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLog(
                            expandedLog === log.id ? null : log.id
                          )}
                        >
                          {expandedLog === log.id ? 'Скрыть' : 'Показать'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedLog === log.id && log.context && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="bg-gray-50 p-4 rounded border">
                          <h4 className="font-medium mb-2">Контекст:</h4>
                          <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {logs.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Логи не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
