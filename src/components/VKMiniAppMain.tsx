
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useVKBridge from "@/hooks/useVKBridge";

export const VKMiniAppMain: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [detectionResults, setDetectionResults] = useState<any>(null);

  // Максимально детальная диагностика VK окружения
  useEffect(() => {
    console.log("=== VK MINI APP MAIN MOUNTED ===");
    setMounted(true);
    
    // Немедленная проверка всех VK объектов
    const vkDetection = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      
      // Проверка VK объектов
      windowVKBridge: {
        exists: !!window.vkBridge,
        type: typeof window.vkBridge,
        methods: window.vkBridge ? Object.keys(window.vkBridge) : [],
      },
      
      windowVKWebAppInit: {
        exists: !!window.VKWebAppInit,
        type: typeof window.VKWebAppInit,
      },
      
      // Поиск всех VK свойств в window
      allVKProperties: Object.keys(window).filter(key => 
        key.toLowerCase().includes('vk')
      ),
      
      // Проверка iframe контекста
      iframeContext: {
        isInIframe: window !== window.top,
        hasParent: !!window.parent,
        hasTop: !!window.top,
      },
      
      // URL параметры
      urlParams: new URLSearchParams(window.location.search),
      hashParams: new URLSearchParams(window.location.hash.slice(1)),
      
      // Проверка User Agent на VK подписи
      userAgentChecks: {
        hasVKMA: /VKMA/.test(navigator.userAgent),
        hasVKApp: /VKApp/.test(navigator.userAgent),
        hasVK: /VK\//.test(navigator.userAgent),
        hasMobile: /Mobile/.test(navigator.userAgent),
      }
    };
    
    console.log("ПОЛНАЯ VK ДИАГНОСТИКА:", vkDetection);
    setDetectionResults(vkDetection);
    
    // Проверка доступа к родительскому окну
    try {
      console.log("Parent window location:", window.parent.location.href);
    } catch (e) {
      console.log("Parent window access denied:", e.message);
    }
    
    // Попытка обращения к VK Bridge через разные пути
    const bridgePaths = [
      () => window.vkBridge,
      () => (window as any).VKWebApp,
      () => (window as any).VK,
      () => window.parent?.vkBridge,
      () => window.top?.vkBridge,
    ];
    
    bridgePaths.forEach((pathFn, index) => {
      try {
        const result = pathFn();
        console.log(`VK Bridge path ${index}:`, result);
      } catch (e) {
        console.log(`VK Bridge path ${index} error:`, e.message);
      }
    });
    
    // Слушаем все сообщения
    const messageHandler = (event: MessageEvent) => {
      console.log("RECEIVED MESSAGE:", {
        origin: event.origin,
        data: event.data,
        source: event.source,
        timestamp: new Date().toISOString()
      });
    };
    
    window.addEventListener('message', messageHandler);
    
    // Отправляем тестовое сообщение родителю
    try {
      window.parent.postMessage({
        type: 'vk_test_message',
        data: 'Hello from VK Mini App'
      }, '*');
      console.log("Test message sent to parent");
    } catch (e) {
      console.log("Failed to send test message:", e.message);
    }
    
    return () => {
      window.removeEventListener('message', messageHandler);
      console.log("VK Mini App Main unmounted");
    };
  }, []);

  const { isAvailable, user, error, authorize, loading, diagnostics } = useVKBridge();

  // Логируем изменения состояния VK Bridge
  useEffect(() => {
    console.log("VK BRIDGE STATE CHANGE:", {
      isAvailable,
      hasUser: !!user,
      hasError: !!error,
      isLoading: loading,
      timestamp: new Date().toISOString()
    });
  }, [isAvailable, user, error, loading]);

  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'red', 
        color: 'white', 
        padding: '20px',
        fontSize: '18px' 
      }}>
        LOADING VK MINI APP...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '16px'
    }}>
      {/* Статус индикатор */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'green',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        ✅ VK APP LOADED - {new Date().toLocaleTimeString()}
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        
        {/* Заголовок */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          margin: '-24px -24px 24px -24px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌿</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            VK Mini App (Debug Mode)
          </h1>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>
            Кельтский гороскоп деревьев 🌳
          </p>
        </div>

        {/* Детальная диагностика */}
        {detectionResults && (
          <div style={{
            background: '#f3f4f6',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
              🔍 Детальная VK диагностика:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <strong>VK Bridge:</strong> {detectionResults.windowVKBridge.exists ? '✅' : '❌'}
              </div>
              <div>
                <strong>VK Init:</strong> {detectionResults.windowVKWebAppInit.exists ? '✅' : '❌'}
              </div>
              <div>
                <strong>В iframe:</strong> {detectionResults.iframeContext.isInIframe ? '✅' : '❌'}
              </div>
              <div>
                <strong>VKMA UA:</strong> {detectionResults.userAgentChecks.hasVKMA ? '✅' : '❌'}
              </div>
              <div>
                <strong>VKApp UA:</strong> {detectionResults.userAgentChecks.hasVKApp ? '✅' : '❌'}
              </div>
              <div>
                <strong>VK Props:</strong> {detectionResults.allVKProperties.length}
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
              <div><strong>URL:</strong> {detectionResults.url}</div>
              <div><strong>Referrer:</strong> {detectionResults.referrer || 'нет'}</div>
              <div><strong>UserAgent:</strong> {detectionResults.userAgent.substring(0, 100)}...</div>
            </div>
          </div>
        )}

        {/* VK Bridge статус */}
        <div style={{
          background: isAvailable ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${isAvailable ? '#16a34a' : '#dc2626'}`,
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            VK Bridge статус: {isAvailable ? '✅ ДОСТУПЕН' : '❌ НЕДОСТУПЕН'}
          </div>
          {diagnostics && (
            <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Bridge: {diagnostics.hasVKBridge ? '✅' : '❌'}</div>
              <div>Legacy: {diagnostics.hasLegacyVK ? '✅' : '❌'}</div>
              <div>UserAgent: {diagnostics.isVKUserAgent ? '✅' : '❌'}</div>
              <div>Params: {diagnostics.hasVKParams ? '✅' : '❌'}</div>
            </div>
          )}
        </div>
        
        {/* Основное содержимое */}
        {!isAvailable && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              VK Bridge не обнаружен
            </div>
            <div style={{ fontSize: '14px' }}>
              Все проверки показывают отсутствие VK окружения.
              Проверьте логи в админ-панели для подробностей.
            </div>
          </div>
        )}
        
        {isAvailable && !user && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#dcfce7',
              border: '1px solid #16a34a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ color: '#15803d', fontWeight: 'bold' }}>✓ VK Bridge обнаружен</div>
              <div style={{ fontSize: '14px', color: '#16a34a', marginTop: '4px' }}>
                Нажмите для авторизации
              </div>
            </div>
            <Button
              onClick={authorize}
              className="w-full text-white font-bold shadow bg-blue-700 hover:bg-blue-800 rounded-xl py-3"
              disabled={loading}
            >
              {loading ? "Авторизация..." : "Войти через VK"}
            </Button>
          </div>
        )}
        
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '14px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Ошибка VK:</div>
            <div>{error}</div>
          </div>
        )}
        
        {user && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#dcfce7',
              border: '1px solid #16a34a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ color: '#15803d', fontWeight: 'bold', marginBottom: '8px' }}>
                ✓ Успешная авторизация VK
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {user.photo_200 && (
                  <img
                    src={user.photo_200}
                    alt={user.first_name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '2px solid #3b82f6'
                    }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e40af' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#3b82f6' }}>
                    VK ID: {user.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка для принудительного обновления диагностики */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            🔄 Перезагрузить диагностику
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VKMiniAppMain;
