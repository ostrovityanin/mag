
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const zodiacSigns = [
  { id: 'aries', name: 'Aries', emoji: '♈', dates: 'Mar 21 - Apr 19' },
  { id: 'taurus', name: 'Taurus', emoji: '♉', dates: 'Apr 20 - May 20' },
  { id: 'gemini', name: 'Gemini', emoji: '♊', dates: 'May 21 - Jun 20' },
  { id: 'cancer', name: 'Cancer', emoji: '♋', dates: 'Jun 21 - Jul 22' },
  { id: 'leo', name: 'Leo', emoji: '♌', dates: 'Jul 23 - Aug 22' },
  { id: 'virgo', name: 'Virgo', emoji: '♍', dates: 'Aug 23 - Sep 22' },
  { id: 'libra', name: 'Libra', emoji: '♎', dates: 'Sep 23 - Oct 22' },
  { id: 'scorpio', name: 'Scorpio', emoji: '♏', dates: 'Oct 23 - Nov 21' },
  { id: 'sagittarius', name: 'Sagittarius', emoji: '♐', dates: 'Nov 22 - Dec 21' },
  { id: 'capricorn', name: 'Capricorn', emoji: '♑', dates: 'Dec 22 - Jan 19' },
  { id: 'aquarius', name: 'Aquarius', emoji: '♒', dates: 'Jan 20 - Feb 18' },
  { id: 'pisces', name: 'Pisces', emoji: '♓', dates: 'Feb 19 - Mar 20' }
];

interface ZodiacSelectorProps {
  selectedSign: string | null;
  onSignSelect: (sign: string) => void;
  className?: string;
}

export const ZodiacSelector: React.FC<ZodiacSelectorProps> = ({
  selectedSign,
  onSignSelect,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-3 gap-3 p-4", className)}>
      {zodiacSigns.map((sign) => (
        <Button
          key={sign.id}
          variant={selectedSign === sign.id ? "default" : "outline"}
          className={cn(
            "flex flex-col items-center justify-center h-20 text-center transition-all",
            selectedSign === sign.id && "ring-2 ring-blue-500"
          )}
          onClick={() => onSignSelect(sign.id)}
        >
          <span className="text-2xl mb-1">{sign.emoji}</span>
          <span className="text-xs font-medium">{sign.name}</span>
        </Button>
      ))}
    </div>
  );
};
