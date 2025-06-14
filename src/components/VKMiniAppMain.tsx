
import React from "react";
import { Button } from "@/components/ui/button";
import useVKBridge from "@/hooks/useVKBridge";

export const VKMiniAppMain: React.FC = () => {
  const { isAvailable, user, error, authorize, loading } = useVKBridge();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 animate-fade-in">
      <div className="w-full max-w-md p-8 rounded-xl bg-white/80 shadow-2xl border border-blue-200 flex flex-col items-center relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-4xl select-none">🌿</span>
          <span className="font-extrabold text-2xl text-blue-900 drop-shadow">VK Mini App</span>
        </div>
        <div className="mb-4 text-center text-blue-800 font-semibold">
          Кельтский гороскоп деревьев <span className="text-2xl">🌳</span>
        </div>
        
        {/* Отладочная информация */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600 w-full">
          <div>VK Bridge доступен: {isAvailable ? 'Да' : 'Нет'}</div>
          <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
          <div>URL: {window.location.href}</div>
        </div>
        
        {!isAvailable && (
          <div className="text-red-600 font-medium text-center mb-2">
            Приложение открыто не во ВКонтакте<br />
            Попробуйте открыть его через VK Mini Apps.
          </div>
        )}
        
        {isAvailable && !user && (
          <Button
            onClick={authorize}
            className="w-full text-white font-bold shadow bg-blue-700 hover:bg-blue-800 rounded-xl"
            disabled={loading}
          >
            {loading ? "Загрузка..." : "Войти через VK"}
          </Button>
        )}
        
        {error && (
          <div className="text-red-500 mt-3 text-center text-sm">{error}</div>
        )}
        
        {user && (
          <div className="mt-6 w-full text-center animate-fade-in-fast">
            <div className="flex flex-col items-center gap-2">
              {user.photo_200 && (
                <img
                  src={user.photo_200}
                  alt={user.first_name}
                  className="w-16 h-16 rounded-full border-2 border-blue-200 shadow"
                />
              )}
              <div className="font-bold text-lg text-blue-800">{user.first_name} {user.last_name}</div>
              <div className="text-blue-700 text-sm">
                id: {user.id}
              </div>
            </div>
            <div className="mt-4 text-gray-700">
              Добро пожаловать в VK Mini App кельтского гороскопа!<br />
              <span className="font-semibold">Здесь в будущем будет ваша персональная информация и функционал.</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Фоновая декорация */}
      <div className="fixed left-0 right-0 bottom-0 flex justify-center p-2 pointer-events-none select-none opacity-30">
        <span className="text-7xl text-cyan-200">🌿</span>
        <span className="text-8xl text-blue-100 -ml-6">🌳</span>
        <span className="text-7xl text-green-100 -ml-4">🍀</span>
      </div>
    </div>
  );
};

export default VKMiniAppMain;
