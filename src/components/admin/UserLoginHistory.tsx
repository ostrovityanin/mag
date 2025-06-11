import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  User, 
  Users, 
  Clock, 
  Shield, 
  Crown, 
  Settings,
  RefreshCw,
  Calendar,
  Hash
} from 'lucide-react';

interface TelegramUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  photo_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

type SortBy = 'recent' | 'username' | 'created_at';

export const UserLoginHistory: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['telegram-users', sortBy],
    queryFn: async (): Promise<TelegramUser[]> => {
      console.log('=== ЗАГРУЗКА РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ ===');
      
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .order(sortBy === 'recent' ? 'last_login' : sortBy, { ascending: false })
        .limit(200);
      
      if (error) {
        console.error('Ошибка получения пользователей:', error);
        throw error;
      }
      
      // Фильтруем только реальных пользователей Telegram
      const realUsers = (data || []).filter(user => {
        const isValidTelegramId = user.telegram_id && 
                                  user.telegram_id > 0 && 
                                  typeof user.telegram_id === 'number';
        
        const isNotTestUser = user.telegram_id !== 123456789 && 
                              user.telegram_id !== 999999999;
        
        const hasValidData = user.first_name || user.username;
        
        console.log(`Проверка пользователя ${user.telegram_id}:`, {
          isValidTelegramId,
          isNotTestUser, 
          hasValidData,
          include: isValidTelegramId && isNotTestUser && hasValidData
        });
        
        return isValidTelegramId && isNotTestUser && hasValidData;
      });
      
      console.log('Общее количество записей в БД:', data?.length);
      console.log('Отфильтровано реальных пользователей:', realUsers.length);
      console.log('Реальные пользователи:', realUsers);
      
      return realUsers;
    },
  });

  const stats = {
    total: users.length,
    premium: users.filter(u => u.is_premium).length,
    recent: users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastLogin > dayAgo;
    }).length,
    withUsername: users.filter(u => u.username).length,
  };

  const handleRefresh = () => {
    console.log('Обновление списка пользователей...');
    refetch();
  };

  const handleSort = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatTelegramId = (telegramId: number) => {
    return telegramId.toLocaleString('ru-RU');
  };

  const getUserDisplayName = (user: TelegramUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.username) {
      return `@${user.username}`;
    }
    return `ID: ${user.telegram_id}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>История входов пользователей</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner className="mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего пользователей</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold">{stats.premium}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">За сутки</p>
                <p className="text-2xl font-bold">{stats.recent}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">С username</p>
                <p className="text-2xl font-bold">{stats.withUsername}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основная таблица */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Реальные пользователи Telegram</span>
              </CardTitle>
              <CardDescription>
                Отображаются только подтвержденные пользователи из Telegram
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('recent')}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  По входу
                </Button>
                <Button
                  variant={sortBy === 'username' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('username')}
                >
                  <User className="h-4 w-4 mr-1" />
                  По имени
                </Button>
                <Button
                  variant={sortBy === 'created_at' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('created_at')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  По дате
                </Button>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Обновить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Язык</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead>Регистрация</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {getUserDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{getUserDisplayName(user)}</p>
                          {user.is_bot && (
                            <Badge variant="secondary" className="text-xs">
                              <Settings className="h-3 w-3 mr-1" />
                              Бот
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm">{formatTelegramId(user.telegram_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.username ? (
                        <span className="text-blue-600">@{user.username}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.language_code?.toUpperCase() || 'RU'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {user.is_premium && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {!user.is_premium && (
                          <Badge variant="outline">
                            Обычный
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(user.last_login)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Реальные пользователи Telegram не найдены
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Пользователи появятся здесь после входа через Telegram WebApp
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
