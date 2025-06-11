
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, User, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TelegramUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_premium: boolean;
  last_login: string;
  created_at: string;
}

export const UserLoginHistory: React.FC = () => {
  const [sortBy, setSortBy] = useState<'last_login' | 'created_at'>('last_login');

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['telegram-users', sortBy],
    queryFn: async (): Promise<TelegramUser[]> => {
      console.log('=== ЗАГРУЗКА РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ ===');
      
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(200);
      
      if (error) {
        console.error('Ошибка получения пользователей:', error);
        throw error;
      }
      
      // Фильтруем только реальных пользователей (проверяем, что telegram_id > 0 и не является тестовым)
      const realUsers = (data || []).filter(user => 
        user.telegram_id && 
        user.telegram_id > 0 && 
        user.telegram_id !== 123456789 && // исключаем тестовый ID
        typeof user.telegram_id === 'number'
      );
      
      console.log('Найдено реальных пользователей:', realUsers.length);
      console.log('Пользователи:', realUsers);
      
      return realUsers;
    },
  });

  const formatUserName = (user: TelegramUser) => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Без имени';
  };

  const formatTelegramId = (telegramId: number) => {
    return telegramId.toString();
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'сегодня';
    if (diffDays === 2) return 'вчера';
    if (diffDays <= 7) return `${diffDays} дня назад`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`;
    return `${Math.floor(diffDays / 30)} месяцев назад`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>История логинов пользователей</span>
            <Badge variant="secondary">{users.length}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'last_login' | 'created_at')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="last_login">По последнему входу</option>
              <option value="created_at">По регистрации</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Telegram ID</TableHead>
                <TableHead className="w-[150px]">Username</TableHead>
                <TableHead className="w-[200px]">Имя</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead className="w-[150px]">Последний вход</TableHead>
                <TableHead className="w-[150px]">Регистрация</TableHead>
                <TableHead className="w-[100px]">Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">
                      {formatTelegramId(user.telegram_id)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">
                        {user.username ? `@${user.username}` : 'Не указан'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{formatUserName(user)}</span>
                      {user.is_premium && (
                        <div className="relative group">
                          <Crown className="h-3 w-3 text-yellow-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Telegram Premium
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {user.is_premium && (
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Активен
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <div className="font-medium">
                        {format(new Date(user.last_login), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getDaysAgo(user.last_login)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <div className="font-medium">
                        {format(new Date(user.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getDaysAgo(user.created_at)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          getDaysAgo(user.last_login).includes('сегодня') || getDaysAgo(user.last_login).includes('вчера')
                            ? 'bg-green-500' 
                            : getDaysAgo(user.last_login).includes('дня назад')
                            ? 'bg-yellow-500'
                            : 'bg-gray-300'
                        }`}
                        title={
                          getDaysAgo(user.last_login).includes('сегодня') || getDaysAgo(user.last_login).includes('вчера')
                            ? 'Активен'
                            : getDaysAgo(user.last_login).includes('дня назад')
                            ? 'Недавно'
                            : 'Давно не заходил'
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Реальные пользователи не найдены
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
