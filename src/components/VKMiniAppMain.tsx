
import React from "react";
import { Button } from "@/components/ui/button";
import useVKBridge from "@/hooks/useVKBridge";

export const VKMiniAppMain: React.FC = () => {
  const { isAvailable, user, error, authorize, loading, diagnostics } = useVKBridge();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 animate-fade-in p-4">
      <div className="w-full max-w-lg rounded-xl bg-white/90 shadow-2xl border border-blue-200 flex flex-col items-center relative overflow-hidden">
        
        {/* Заголовок */}
        <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl select-none">🌿</span>
            <span className="font-extrabold text-2xl text-white drop-shadow">VK Mini App</span>
          </div>
          <div className="text-blue-100 font-medium">
            Кельтский гороскоп деревьев <span className="text-2xl">🌳</span>
          </div>
        </div>

        <div className="p-6 w-full">
          {/* Статус VK Bridge */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-semibold text-gray-700 mb-2">Статус VK Bridge:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Доступен: <span className={isAvailable ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isAvailable ? 'Да' : 'Нет'}</span></div>
              <div>VK Bridge: <span className={diagnostics?.hasVKBridge ? 'text-green-600' : 'text-red-600'}>{diagnostics?.hasVKBridge ? 'Да' : 'Нет'}</span></div>
              <div>Legacy VK: <span className={diagnostics?.hasLegacyVK ? 'text-green-600' : 'text-red-600'}>{diagnostics?.hasLegacyVK ? 'Да' : 'Нет'}</span></div>
              <div>VK User Agent: <span className={diagnostics?.isVKUserAgent ? 'text-green-600' : 'text-red-600'}>{diagnostics?.isVKUserAgent ? 'Да' : 'Нет'}</span></div>
            </div>
            {diagnostics?.hasVKParams && (
              <div className="mt-2 text-xs text-green-600">✓ VK параметры найдены в URL</div>
            )}
          </div>
          
          {/* Основное содержимое */}
          {!isAvailable && (
            <div className="text-red-600 font-medium text-center mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg mb-2">⚠️ Приложение открыто не во ВКонтакте</div>
              <div className="text-sm">
                Для корректной работы откройте приложение через VK Mini Apps.
              </div>
            </div>
          )}
          
          {isAvailable && !user && (
            <div className="text-center">
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-700 font-medium">✓ VK Bridge доступен</div>
                <div className="text-sm text-green-600 mt-1">Нажмите кнопку для входа</div>
              </div>
              <Button
                onClick={authorize}
                className="w-full text-white font-bold shadow bg-blue-700 hover:bg-blue-800 rounded-xl py-3"
                disabled={loading}
              >
                {loading ? "Загрузка..." : "Войти через VK"}
              </Button>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
              <div className="font-medium mb-1">Ошибка:</div>
              <div>{error}</div>
            </div>
          )}
          
          {user && (
            <div className="text-center animate-fade-in-fast">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <div className="text-green-700 font-medium mb-2">✓ Успешный вход</div>
                <div className="flex flex-col items-center gap-3">
                  {user.photo_200 && (
                    <img
                      src={user.photo_200}
                      alt={user.first_name}
                      className="w-16 h-16 rounded-full border-2 border-blue-200 shadow"
                    />
                  )}
                  <div>
                    <div className="font-bold text-lg text-blue-800">{user.first_name} {user.last_name}</div>
                    <div className="text-blue-700 text-sm">ID: {user.id}</div>
                  </div>
                </div>
              </div>
              <div className="text-gray-700 text-sm">
                <div className="font-semibold mb-1">Добро пожаловать в VK Mini App!</div>
                <div>Кельтский гороскоп деревьев готов к использованию.</div>
              </div>
            </div>
          )}
        </div>

        {/* Детальная диагностика (сворачиваемая) */}
        {diagnostics && (
          <details className="w-full border-t border-gray-200">
            <summary className="cursor-pointer p-4 bg-gray-50 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Детальная диагностика (для отладки)
            </summary>
            <div className="p-4 bg-gray-50 border-t">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-gray-700">User Agent:</div>
                  <div className="bg-white p-2 rounded border break-all">{diagnostics.userAgent}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">URL:</div>
                  <div className="bg-white p-2 rounded border break-all">{diagnostics.url}</div>
                </div>
                {diagnostics.vkBridgeMethods.length > 0 && (
                  <div>
                    <div className="font-semibold text-gray-700">Доступные VK методы:</div>
                    <div className="bg-white p-2 rounded border">
                      {diagnostics.vkBridgeMethods.join(', ')}
                    </div>
                  </div>
                )}
                {diagnostics.errors.length > 0 && (
                  <div>
                    <div className="font-semibold text-red-700">Ошибки:</div>
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      {diagnostics.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}
      </div>
      
      {/* Фоновая декорация */}
      <div className="fixed left-0 right-0 bottom-0 flex justify-center p-2 pointer-events-none select-none opacity-20">
        <span className="text-6xl text-cyan-200">🌿</span>
        <span className="text-7xl text-blue-100 -ml-6">🌳</span>
        <span className="text-6xl text-green-100 -ml-4">🍀</span>
      </div>
    </div>
  );
};

export default VKMiniAppMain;
