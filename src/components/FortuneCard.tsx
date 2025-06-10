
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Calendar } from 'lucide-react';

interface FortuneCardProps {
  content: string;
  date: string;
  className?: string;
}

export const FortuneCard: React.FC<FortuneCardProps> = ({
  content,
  date,
  className
}) => {
  return (
    <Card className={`bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cookie className="h-6 w-6 text-amber-600" />
            <div>
              <CardTitle className="text-lg text-amber-800">Fortune Cookie</CardTitle>
              <CardDescription className="text-amber-600">Your daily wisdom</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(date).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed font-medium italic">
          "{content}"
        </p>
      </CardContent>
    </Card>
  );
};
