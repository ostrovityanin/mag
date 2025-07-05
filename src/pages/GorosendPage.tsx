
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, MapPin, Clock, Star } from 'lucide-react';

// Временно закомментируем импорты библиотеки до исправления
// import Origin from '../../gorosend-lib/src/Origin.js';
// import { Horoscope } from '../../gorosend-lib/src/Horoscope.js';

interface PlanetPosition {
  name: string;
  position: string;
  sign: string;
  degree: number;
}

const GorosendPage: React.FC = () => {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [planetPositions, setPlanetPositions] = useState<PlanetPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculateHoroscope = async () => {
    setIsLoading(true);
    try {
      // Временно заглушим расчеты до исправления импортов
      console.log('Расчет гороскопа временно недоступен');
      
      // Пример данных для демонстрации
      const mockData: PlanetPosition[] = [
        { name: 'Солнце', position: '15°30\'', sign: 'Лев', degree: 15.5 },
        { name: 'Луна', position: '22°45\'', sign: 'Рак', degree: 22.75 },
        { name: 'Меркурий', position: '8°12\'', sign: 'Дева', degree: 8.2 },
      ];
      
      setPlanetPositions(mockData);
    } catch (error) {
      console.error('Ошибка при расчете гороскопа:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Star className="h-8 w-8" />
            GOROSEND - Астрологические Расчеты
          </h1>
          <p className="text-blue-200">Точные астрологические данные для вашего гороскопа</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Форма ввода данных */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Данные рождения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="birth-date" className="text-white">Дата рождения</Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder-white/70"
                />
              </div>

              <div>
                <Label htmlFor="birth-time" className="text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Время рождения
                </Label>
                <Input
                  id="birth-time"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Широта
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="55.7558"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder-white/50"
                  />
                </div>

                <div>
                  <Label htmlFor="longitude" className="text-white">Долгота</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="37.6176"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder-white/50"
                  />
                </div>
              </div>

              <Button 
                onClick={calculateHoroscope}
                disabled={isLoading || !birthDate || !birthTime || !latitude || !longitude}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? 'Расчет...' : 'Рассчитать гороскоп'}
              </Button>
            </CardContent>
          </Card>

          {/* Результаты */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Позиции планет</CardTitle>
            </CardHeader>
            <CardContent>
              {planetPositions.length > 0 ? (
                <div className="space-y-3">
                  {planetPositions.map((planet, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center p-3 bg-white/10 rounded-lg"
                    >
                      <span className="text-white font-medium">{planet.name}</span>
                      <div className="text-right">
                        <div className="text-blue-200">{planet.position}</div>
                        <div className="text-sm text-blue-300">{planet.sign}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/70 py-8">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Введите данные рождения и нажмите "Рассчитать гороскоп"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GorosendPage;
