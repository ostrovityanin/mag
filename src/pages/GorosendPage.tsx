
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, MapPin, Clock, Star } from 'lucide-react';
import { Origin, Horoscope } from '../../GOROSEND/src/index.js';

interface PlanetPosition {
  name: string;
  sign: string;
  degrees: number;
  minutes: number;
  seconds: number;
  house?: number;
  isRetrograde?: boolean;
}

const GorosendPage = () => {
  const [formData, setFormData] = useState({
    date: '',
    time: '12:00',
    latitude: '55.7558',
    longitude: '37.6176'
  });
  
  const [results, setResults] = useState<{
    planets: PlanetPosition[];
    houses: any[];
    ascendant: any;
    midheaven: any;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateHoroscope = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.date) {
        throw new Error('Пожалуйста, введите дату');
      }

      const dateObj = new Date(formData.date + 'T' + formData.time);
      
      const origin = new Origin({
        year: dateObj.getFullYear(),
        month: dateObj.getMonth(),
        date: dateObj.getDate(),
        hour: dateObj.getHours(),
        minute: dateObj.getMinutes(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });

      const horoscope = new Horoscope({
        origin: origin,
        houseSystem: 'placidus',
        zodiac: 'tropical',
        aspectPoints: ['bodies', 'points', 'angles'],
        aspectWithPoints: ['bodies', 'points', 'angles'],
        aspectTypes: ['major'],
        language: 'en'
      });

      // Получаем планеты
      const planets: PlanetPosition[] = horoscope.CelestialBodies.all.map((body: any) => ({
        name: body.key,
        sign: body.Sign.key,
        degrees: Math.floor(body.ChartPosition.Ecliptic.DecimalDegrees % 30),
        minutes: Math.floor((body.ChartPosition.Ecliptic.DecimalDegrees % 1) * 60),
        seconds: Math.floor(((body.ChartPosition.Ecliptic.DecimalDegrees % 1) * 60 % 1) * 60),
        house: body.House?.id,
        isRetrograde: body.isRetrograde
      }));

      // Добавляем лунные узлы
      const points = horoscope.CelestialPoints.all.map((point: any) => ({
        name: point.key,
        sign: point.Sign.key,
        degrees: Math.floor(point.ChartPosition.Ecliptic.DecimalDegrees % 30),
        minutes: Math.floor((point.ChartPosition.Ecliptic.DecimalDegrees % 1) * 60),
        seconds: Math.floor(((point.ChartPosition.Ecliptic.DecimalDegrees % 1) * 60 % 1) * 60),
        house: point.House?.id
      }));

      setResults({
        planets: [...planets, ...points],
        houses: horoscope.Houses.all,
        ascendant: horoscope.Ascendant,
        midheaven: horoscope.Midheaven
      });

    } catch (err) {
      console.error('Ошибка расчета:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при расчете');
    } finally {
      setLoading(false);
    }
  };

  const getSignEmoji = (sign: string) => {
    const signs: Record<string, string> = {
      'aries': '♈',
      'taurus': '♉',
      'gemini': '♊',
      'cancer': '♋',
      'leo': '♌',
      'virgo': '♍',
      'libra': '♎',
      'scorpio': '♏',
      'sagittarius': '♐',
      'capricorn': '♑',
      'aquarius': '♒',
      'pisces': '♓'
    };
    return signs[sign] || '';
  };

  const getPlanetEmoji = (planet: string) => {
    const planets: Record<string, string> = {
      'sun': '☉',
      'moon': '☽',
      'mercury': '☿',
      'venus': '♀',
      'mars': '♂',
      'jupiter': '♃',
      'saturn': '♄',
      'uranus': '♅',
      'neptune': '♆',
      'pluto': '♇',
      'northnode': '☊',
      'southnode': '☋',
      'lilith': '⚸'
    };
    return planets[planet] || '●';
  };

  const getPlanetName = (key: string) => {
    const names: Record<string, string> = {
      'sun': 'Солнце',
      'moon': 'Луна',
      'mercury': 'Меркурий',
      'venus': 'Венера',
      'mars': 'Марс',
      'jupiter': 'Юпитер',
      'saturn': 'Сатурн',
      'uranus': 'Уран',
      'neptune': 'Нептун',
      'pluto': 'Плутон',
      'northnode': 'Северный узел',
      'southnode': 'Южный узел',
      'lilith': 'Лилит'
    };
    return names[key] || key;
  };

  const getSignName = (key: string) => {
    const names: Record<string, string> = {
      'aries': 'Овен',
      'taurus': 'Телец',
      'gemini': 'Близнецы',
      'cancer': 'Рак',
      'leo': 'Лев',
      'virgo': 'Дева',
      'libra': 'Весы',
      'scorpio': 'Скорпион',
      'sagittarius': 'Стрелец',
      'capricorn': 'Козерог',
      'aquarius': 'Водолей',
      'pisces': 'Рыбы'
    };
    return names[key] || key;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            <Star className="text-yellow-400" size={48} />
            GOROSEND
            <Star className="text-yellow-400" size={48} />
          </h1>
          <p className="text-xl text-blue-200">
            Астрологические расчеты и карта неба
          </p>
        </div>

        {/* Форма ввода */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarDays className="text-blue-400" />
              Данные для расчета
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="date" className="text-white">Дата</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="time" className="text-white">Время</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="latitude" className="text-white">Широта</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="bg-white/20 border-white/30 text-white"
                  placeholder="55.7558"
                />
              </div>
              
              <div>
                <Label htmlFor="longitude" className="text-white">Долгота</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="bg-white/20 border-white/30 text-white"
                  placeholder="37.6176"
                />
              </div>
            </div>
            
            <Button 
              onClick={calculateHoroscope}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Clock className="animate-spin mr-2" size={16} />
                  Рассчитываем...
                </>
              ) : (
                <>
                  <Star className="mr-2" size={16} />
                  Рассчитать позиции планет
                </>
              )}
            </Button>
            
            {error && (
              <div className="text-red-400 text-center p-3 bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Результаты */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Положения планет */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="text-yellow-400" />
                  Положения планет
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.planets.map((planet, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlanetEmoji(planet.name)}</span>
                        <div>
                          <div className="text-white font-medium">
                            {getPlanetName(planet.name)}
                            {planet.isRetrograde && (
                              <span className="text-red-400 ml-1">℞</span>
                            )}
                          </div>
                          <div className="text-blue-200 text-sm">
                            Дом {planet.house || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-medium flex items-center gap-2">
                          <span className="text-xl">{getSignEmoji(planet.sign)}</span>
                          {getSignName(planet.sign)}
                        </div>
                        <div className="text-blue-200 text-sm">
                          {planet.degrees}° {planet.minutes}' {planet.seconds}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Углы карты */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="text-green-400" />
                  Углы карты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Асцендент */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-white font-medium mb-2">Асцендент (AC)</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSignEmoji(results.ascendant.Sign.key)}</span>
                      <span className="text-blue-200">
                        {getSignName(results.ascendant.Sign.key)} {Math.floor(results.ascendant.ChartPosition.Ecliptic.DecimalDegrees % 30)}°
                      </span>
                    </div>
                  </div>

                  {/* Середина неба */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-white font-medium mb-2">Середина неба (MC)</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSignEmoji(results.midheaven.Sign.key)}</span>
                      <span className="text-blue-200">
                        {getSignName(results.midheaven.Sign.key)} {Math.floor(results.midheaven.ChartPosition.Ecliptic.DecimalDegrees % 30)}°
                      </span>
                    </div>
                  </div>

                  {/* Дома */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-white font-medium mb-2">Куспиды домов</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {results.houses.slice(0, 12).map((house, index) => (
                        <div key={index} className="text-blue-200">
                          Дом {index + 1}: {getSignName(house.Sign.key)} {Math.floor(house.ChartPosition.Ecliptic.DecimalDegrees % 30)}°
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GorosendPage;
