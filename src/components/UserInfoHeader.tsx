
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTelegramContext } from '@/components/TelegramProvider';
import { User, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const UserInfoHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useTelegramContext();
  const { toast } = useToast();

  // Не показываем компонент если пользователь не аутентифицирован
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Успешный выход",
        description: "Вы успешно вышли из системы",
      });
    } catch (error) {
      toast({
        title: "Ошибка выхода",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-4 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">
                  {user.first_name} {user.last_name || ''}
                </div>
                {user.username && (
                  <div className="text-sm text-green-600">
                    @{user.username}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline" className="bg-white border-green-300 text-green-700">
              ID: {user.id}
            </Badge>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
