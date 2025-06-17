
import React from 'react';
import { UserInfoHeader } from '@/components/UserInfoHeader';
import { Cookie } from 'lucide-react';
import { CookieFortuneGenerator } from "@/components/CookieFortuneGenerator";

export const CookieAppPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-6">
        <UserInfoHeader />
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Cookie className="h-6 w-6 text-orange-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Печенька с предсказанием!
            </h1>
          </div>
        </div>
        
        <CookieFortuneGenerator />
      </div>
    </div>
  );
};
