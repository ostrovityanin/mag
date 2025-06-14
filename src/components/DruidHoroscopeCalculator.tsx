
import React from "react";
import { TreePine } from "lucide-react";
import { DruidHoroscopeForm } from "./DruidHoroscopeForm";

// DESCRIPTION и вводный текст — удалены

export const DruidHoroscopeCalculator: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-stretch">
      <div className="flex flex-col md:flex-row gap-6 px-2 sm:px-4 py-8 mx-auto w-full max-w-6xl">
        {/* Sticky боковая форма/панель */}
        <div className="md:w-[370px] w-full flex-shrink-0">
          <div className="md:sticky md:top-8 md:mb-0 mb-4 z-10">
            <header className="flex flex-col items-center mb-2 animate-fade-in">
              <div className="flex items-center gap-2 text-green-800 text-xl sm:text-2xl font-extrabold mb-1 tracking-tight">
                <TreePine className="w-7 h-7 text-green-700 inline-block" />
                <span className="drop-shadow text-3xl font-playfair select-none">
                  Кельтский гороскоп деревьев
                </span>
              </div>
              <p className="text-green-700 mt-2 text-sm font-medium opacity-80 italic">
                Определите свой знак по дате рождения
              </p>
            </header>
            <DruidHoroscopeForm />
            {/* Декоративка */}
            <div className="flex justify-center mt-3 animate-fade-in">
              <div className="flex gap-1">
                <span className="inline-block text-green-800/70 text-2xl">🌱</span>
                <span className="inline-block text-green-800/70 text-xl">🍃</span>
                <span className="inline-block text-green-800/70 text-2xl">🌿</span>
                <span className="inline-block text-green-800/70 text-xl">🌳</span>
                <span className="inline-block text-green-800/70 text-2xl">🌲</span>
              </div>
            </div>
          </div>
        </div>
        {/* Текстовый блок — убран */}
        <div className="flex-1 min-w-0" />
      </div>
      {/* Фоновый анимированный орнамент */}
      <div className="fixed left-0 right-0 bottom-0 opacity-30 pointer-events-none z-0">
        <div className="flex justify-center animate-fade-in-slow">
          <span className="text-6xl sm:text-8xl select-none text-emerald-100">🌿</span>
          <span className="text-5xl sm:text-8xl select-none text-emerald-200 -ml-6">🌳</span>
          <span className="text-7xl sm:text-8xl select-none text-emerald-100 -ml-4">🍀</span>
        </div>
      </div>
    </div>
  );
};

