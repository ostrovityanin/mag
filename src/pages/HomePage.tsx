
import React from 'react';
import { Link } from 'react-router-dom';
import { useTelegramContext } from '@/components/TelegramProvider';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TreePine, Settings } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, hapticFeedback } = useTelegramContext();

  const handleAppSelect = (appName: string) => {
    hapticFeedback.selection();
    console.log(`Selected app: ${appName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Mystic Hub
          </h1>
          {user && (
            <p className="text-gray-600">
              Добро пожаловать, {user.first_name}! ✨
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Выберите приложение для получения предсказаний
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Druid App */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/druid" onClick={() => handleAppSelect('druid')}>
              <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <TreePine className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">
                  Друидские Предсказания
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 text-center mb-4">
                  Древняя мудрость природы откроет вам тайны будущего
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-green-500" />
                    <span>Персональные гороскопы</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TreePine className="h-4 w-4 text-green-500" />
                    <span>Друидская мудрость</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Войти в приложение
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Placeholder for future apps */}
          <Card className="opacity-60">
            <CardHeader className="text-center bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <CardTitle className="text-xl text-gray-600">
                Скоро...
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center mb-4">
                Новые мистические приложения уже в разработке
              </p>
              <Button disabled className="w-full">
                В разработке
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Section */}
        <div className="mt-12 text-center">
          <Link to="/admin">
            <Button variant="outline" size="sm" className="text-gray-600">
              <Settings className="h-4 w-4 mr-2" />
              Панель администратора
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
