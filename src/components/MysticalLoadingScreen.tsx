
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { TreePine, Stars, Moon, Sparkles } from 'lucide-react';

interface MysticalLoadingScreenProps {
  progress?: number;
  currentChannel?: string;
}

export const MysticalLoadingScreen: React.FC<MysticalLoadingScreenProps> = ({
  progress,
  currentChannel,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      {/* Мистические звёзды на фоне */}
      <div className="absolute inset-0">
        <Stars className="absolute top-10 left-10 h-4 w-4 text-yellow-300 animate-pulse" />
        <Stars className="absolute top-20 right-20 h-3 w-3 text-blue-300 animate-pulse delay-300" />
        <Stars className="absolute bottom-20 left-20 h-5 w-5 text-purple-300 animate-pulse delay-700" />
        <Stars className="absolute bottom-10 right-10 h-4 w-4 text-emerald-300 animate-pulse delay-500" />
        <Sparkles className="absolute top-1/3 left-1/4 h-6 w-6 text-pink-300 animate-bounce delay-1000" />
        <Sparkles className="absolute top-2/3 right-1/4 h-5 w-5 text-cyan-300 animate-bounce delay-1500" />
        <Moon className="absolute top-16 right-1/3 h-8 w-8 text-yellow-200 opacity-70" />
      </div>

      <Card className="w-full max-w-md mx-4 bg-black/30 backdrop-blur-md border-purple-500/30 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Главная иконка */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <TreePine className="h-10 w-10 text-white animate-pulse" />
            </div>
          </div>

          {/* Заголовок */}
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-400 bg-clip-text mb-2">
            Друидская Магия
          </h2>
          <p className="text-purple-200 text-sm mb-6">
            Пробуждаем древние связи...
          </p>

          {/* Прогресс бар */}
          {progress !== undefined && (
            <div className="mb-4">
              <Progress 
                value={progress} 
                className="h-3 bg-purple-900/50 border border-purple-500/30"
              />
              <div className="mt-2 text-right">
                <span className="text-xs text-purple-300">
                  {progress}%
                </span>
              </div>
            </div>
          )}

          {/* Текущее действие */}
          <div className="space-y-2 mt-4">
            <p className="text-emerald-300 text-sm font-medium animate-pulse">
              {currentChannel || 'Соединяемся с лесом...'}
            </p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          {/* Мистический текст */}
          <p className="text-xs text-purple-300 mt-4 opacity-70 italic">
            Древние духи проверяют ваши связи с магическими кругами...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
