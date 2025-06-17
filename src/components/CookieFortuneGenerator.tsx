
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cookie, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { useTelegramContext } from '@/components/TelegramProvider';

interface Fortune {
  text: string;
  category: string;
  date: string;
}

const FORTUNES = [
  { text: "Удача улыбнется вам в самый неожиданный момент!", category: "Удача", color: "bg-green-100 text-green-700" },
  { text: "Сегодня вас ждет приятное знакомство.", category: "Любовь", color: "bg-pink-100 text-pink-700" },
  { text: "Ваша упорность приведет к успеху в важном деле.", category: "Карьера", color: "bg-blue-100 text-blue-700" },
  { text: "Доверьтесь интуиции - она не подведет.", category: "Мудрость", color: "bg-purple-100 text-purple-700" },
  { text: "Новый день принесет неожиданные возможности.", category: "Возможности", color: "bg-yellow-100 text-yellow-700" },
  { text: "Ваша доброта вернется к вам сторицей.", category: "Доброта", color: "bg-emerald-100 text-emerald-700" },
  { text: "Смелый шаг откроет новые горизонты.", category: "Смелость", color: "bg-orange-100 text-orange-700" },
  { text: "Счастье уже рядом - просто оглянитесь!", category: "Счастье", color: "bg-rose-100 text-rose-700" },
  { text: "Ваши мечты ближе к реальности, чем кажется.", category: "Мечты", color: "bg-indigo-100 text-indigo-700" },
  { text: "Сегодня - идеальный день для новых начинаний.", category: "Начинания", color: "bg-teal-100 text-teal-700" }
];

export const CookieFortuneGenerator: React.FC = () => {
  const [currentFortune, setCurrentFortune] = useState<Fortune | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const { hapticFeedback } = useTelegramContext();

  const generateFortune = () => {
    setIsOpening(true);
    hapticFeedback.impact('medium');
    
    setTimeout(() => {
      const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
      setCurrentFortune({
        ...randomFortune,
        date: new Date().toLocaleDateString('ru-RU')
      });
      setIsOpening(false);
      hapticFeedback.notification('success');
    }, 1500);
  };

  const getCategoryColor = (category: string) => {
    const fortune = FORTUNES.find(f => f.category === category);
    return fortune?.color || "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6">
      {/* Печенька */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-amber-800">
            <Cookie className="h-6 w-6" />
            <span>Волшебное печенье</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="relative">
            <img 
              src="/lovable-uploads/43e53c50-c2b8-4cfd-954b-b8b75c593d11.png" 
              alt="Печенье с предсказанием" 
              className={`w-32 h-32 mx-auto transition-transform duration-1000 ${
                isOpening ? 'scale-110 animate-pulse' : 'hover:scale-105'
              }`}
            />
            {isOpening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-yellow-500 animate-spin" />
              </div>
            )}
          </div>
          
          <Button
            onClick={generateFortune}
            disabled={isOpening}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {isOpening ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Печенье открывается...
              </>
            ) : (
              <>
                <Cookie className="h-4 w-4 mr-2" />
                Открыть печенье
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-600">
            Нажмите на кнопку, чтобы получить ваше предсказание!
          </p>
        </CardContent>
      </Card>

      {/* Предсказание */}
      {currentFortune && (
        <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg text-orange-800">Ваше предсказание</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(currentFortune.category)}>
                  {currentFortune.category}
                </Badge>
                <Badge variant="outline" className="text-gray-600">
                  <Calendar className="h-3 w-3 mr-1" />
                  {currentFortune.date}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <blockquote className="text-lg text-gray-700 leading-relaxed font-medium italic border-l-4 border-orange-300 pl-4">
              "{currentFortune.text}"
            </blockquote>
            <div className="mt-4 text-center">
              <Button
                onClick={generateFortune}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Получить новое предсказание
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Cookie className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Печеньки с предсказаниями
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Каждое печенье содержит уникальное предсказание, созданное специально для вас!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
