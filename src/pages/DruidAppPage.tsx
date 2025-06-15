
import React from 'react';
import { UserInfoHeader } from '@/components/UserInfoHeader';
import { TreePine } from 'lucide-react';
import { DruidHoroscopeCalculator } from "@/components/DruidHoroscopeCalculator";

export const DruidAppPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-6">
        <UserInfoHeader />
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Друидские Предсказания
            </h1>
          </div>
        </div>
        
        <DruidHoroscopeCalculator />
      </div>
    </div>
  );
};
