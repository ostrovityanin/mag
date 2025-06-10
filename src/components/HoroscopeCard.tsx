
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar } from 'lucide-react';
import { zodiacSigns } from '@/components/ui/zodiac-selector';

interface HoroscopeCardProps {
  zodiacSign: string;
  content: string;
  date: string;
  className?: string;
}

export const HoroscopeCard: React.FC<HoroscopeCardProps> = ({
  zodiacSign,
  content,
  date,
  className
}) => {
  const sign = zodiacSigns.find(s => s.id === zodiacSign);
  
  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{sign?.emoji}</span>
            <div>
              <CardTitle className="text-lg text-purple-800">{sign?.name}</CardTitle>
              <CardDescription className="text-purple-600">{sign?.dates}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(date).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-2">
          <Star className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-gray-700 leading-relaxed">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
};
