
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, MapPin, Clock, Star } from 'lucide-react';

// Импортируем библиотеку gorosend-lib
import { Origin } from '../../gorosend-lib/src/Origin';
import { Horoscope } from '../../gorosend-lib/src/Horoscope';

interface PlanetPosition {
  name: string;
  position: string;
  sign: string;
  degree: number;
}

const GorosendPage: React.FC = () => {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  // Координаты Москвы по умолчанию
  const [latitude, setLatitude] = useState('55.7558');
  const [longitude, setLongitude] = useState('37.6176');
  const [planetPositions, setPlanetPositions] = useState<PlanetPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateHoroscope = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('=== НАЧИНАЕМ РЕАЛЬНЫЙ РАСЧЕТ ГОРОСКОПА ===');
      console.log('Дата рождения:', birthDate, birthTime);
      console.log('Координаты:', { latitude, longitude });
      
      // Парсим дату и время
      const dateObj = new Date(birthDate + 'T' + birthTime);
      console.log('Объект даты создан:', dateObj);
      
      // Создаем объект Origin
      console.log('Создаем Origin с параметрами:', {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth(),
        date: dateObj.getDate(),
        hour: dateObj.getHours(),
        minute: dateObj.getMinutes(),
        second: dateObj.getSeconds(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      
      const origin = new Origin({
        year: dateObj.getFullYear(),
        month: dateObj.getMonth(), // месяц в Origin начинается с 0
        date: dateObj.getDate(),
        hour: dateObj.getHours(),
        minute: dateObj.getMinutes(),
        second: dateObj.getSeconds(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      
      console.log('Origin успешно создан:', origin);
      console.log('Локальное время Origin:', origin.localTimeFormatted);
      console.log('UTC время Origin:', origin.utcTimeFormatted);
      console.log('Юлианская дата:', origin.julianDate);
      
      // Создаем гороскоп
      console.log('Создаем объект Horoscope...');
      const horoscope = new Horoscope({
        origin: origin,
        houseSystem: 'placidus',
        zodiac: 'tropical',
        aspectPoints: ['bodies'],
        aspectWithPoints: ['bodies'],
        aspectTypes: ["major"],
        customOrbs: {},
        language: 'en'
      });
      
      console.log('Horoscope успешно создан:', horoscope);
      console.log('CelestialBodies объект:', horoscope.CelestialBodies);
      
      // Получаем позиции планет
      const planets = horoscope.CelestialBodies.all;
      console.log('Получены планеты (тип all):', typeof planets, planets);
      
      let planetsList;
      if (typeof planets === 'function') {
        planetsList = planets();
        console.log('Планеты как функция:', planetsList);
      } else if (Array.isArray(planets)) {
        planetsList = planets;
        console.log('Планеты как массив:', planetsList);
      } else {
        console.log('Планеты как объект, ищем массив:', planets);
        planetsList = horoscope.CelestialBodies.all || [];
      }

      console.log('Итоговый список планет:', planetsList);
      
      if (!planetsList || planetsList.length === 0) {
        throw new Error('Не удалось получить данные о планетах');
      }
      
      // Формируем данные для отображения
      const planetData: PlanetPosition[] = planetsList.map((planet: any) => {
        console.log('Обрабатываем планету:', planet);
        
        const degrees = planet.ChartPosition?.Ecliptic?.DecimalDegrees || 0;
        const degreeInt = Math.floor(degrees);
        const minutes = Math.floor((degrees % 1) * 60);
        
        return {
          name: planet.label || planet.key || 'Неизвестная планета',
          position: `${degreeInt}°${minutes}'`,
          sign: planet.Sign?.label || planet.Sign?.key || 'Неизвестный знак',
          degree: degrees
        };
      });
      
      console.log('Сформированные данные планет:', planetData);
      setPlanetPositions(planetData);
      
    } catch (error: any) {
      console.error('=== ОШИБКА ПРИ РАСЧЕТЕ ГОРОСКОПА ===');
      console.error('Тип ошибки:', typeof error);
      console.error('Сообщение ошибки:', error.message);
      console.error('Полная ошибка:', error);
      console.error('Stack trace:', error.stack);
      
      setError(`Ошибка расчета: ${error.message}`);
      
      // В случае ошибки показываем это в интерфейсе, но НЕ показываем моковые данные
      setPlanetPositions([]);
      
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

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Результаты */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Позиции планет</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center text-red-300 py-8">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Произошла ошибка при расчете гороскопа</p>
                  <p className="text-sm mt-2">Проверьте консоль для подробностей</p>
                </div>
              ) : planetPositions.length > 0 ? (
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
