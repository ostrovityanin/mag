
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useVKBridge from "@/hooks/useVKBridge";

export const VKMiniAppMain: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [basicInfo, setBasicInfo] = useState<{
    userAgent: string;
    url: string;
    timestamp: string;
  } | null>(null);

  // Добавляем состояние для отслеживания монтирования компонента
  useEffect(() => {
    console.log("VKMiniAppMain component mounted");
    setMounted(true);
    
    if (typeof window !== "undefined") {
      setBasicInfo({
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      console.log("Basic info collected:", {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      console.log("VKMiniAppMain component unmounted");
    };
  }, []);

  const { isAvailable, user, error, authorize, loading, diagnostics } = useVKBridge();

  // Базовый тест рендеринга
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'red', 
        color: 'white', 
        padding: '20px',
        fontSize: '18px' 
      }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '16px'
    }}>
      {/* Индикатор что приложение работает */}
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
        ✅ APP LOADED
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
            VK Mini App
          </h1>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.9 }}>
            Кельтский гороскоп деревьев 🌳
          </p>
        </div>

        {/* Базовая информация */}
        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Базовая диагностика:</div>
          {basicInfo && (
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div><strong>Время:</strong> {basicInfo.timestamp}</div>
              <div><strong>URL:</strong> {basicInfo.url}</div>
              <div><strong>User Agent:</strong> {basicInfo.userAgent.substring(0, 100)}...</div>
            </div>
          )}
        </div>

        {/* VK Bridge статус */}
        <div style={{
          background: isAvailable ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${isAvailable ? '#16a34a' : '#dc2626'}`,
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Статус VK Bridge: {isAvailable ? '✅ Доступен' : '❌ Недоступен'}
          </div>
          {diagnostics && (
            <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>VK Bridge: {diagnostics.hasVKBridge ? '✅' : '❌'}</div>
              <div>Legacy VK: {diagnostics.hasLegacyVK ? '✅' : '❌'}</div>
              <div>VK User Agent: {diagnostics.isVKUserAgent ? '✅' : '❌'}</div>
              <div>VK Params: {diagnostics.hasVKParams ? '✅' : '❌'}</div>
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
              Приложение открыто не во ВКонтакте
            </div>
            <div style={{ fontSize: '14px' }}>
              Для корректной работы откройте приложение через VK Mini Apps.
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
              <div style={{ color: '#15803d', fontWeight: 'bold' }}>✓ VK Bridge доступен</div>
              <div style={{ fontSize: '14px', color: '#16a34a', marginTop: '4px' }}>
                Нажмите кнопку для входа
              </div>
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
          <div style={{
            background: '#fef2f2',
            border: '1px solid #dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '14px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Ошибка:</div>
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
                ✓ Успешный вход
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
                    ID: {user.id}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ color: '#374151', fontSize: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Добро пожаловать в VK Mini App!
              </div>
              <div>Кельтский гороскоп деревьев готов к использованию.</div>
            </div>
          </div>
        )}

        {/* Детальная диагностика */}
        {diagnostics && (
          <details style={{ 
            width: '100%', 
            marginTop: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px'
          }}>
            <summary style={{
              cursor: 'pointer',
              padding: '12px',
              background: '#f9fafb',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0'
            }}>
              Детальная диагностика (для отладки)
            </summary>
            <div style={{ 
              padding: '12px',
              background: '#f9fafb',
              fontSize: '12px',
              fontFamily: 'monospace',
              borderRadius: '0 0 8px 8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>URL:</strong><br/>
                <div style={{ background: 'white', padding: '4px', borderRadius: '4px', wordBreak: 'break-all' }}>
                  {diagnostics.url}
                </div>
              </div>
              {diagnostics.vkBridgeMethods.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>VK методы:</strong><br/>
                  <div style={{ background: 'white', padding: '4px', borderRadius: '4px' }}>
                    {diagnostics.vkBridgeMethods.join(', ')}
                  </div>
                </div>
              )}
              {diagnostics.errors.length > 0 && (
                <div>
                  <strong style={{ color: '#dc2626' }}>Ошибки:</strong><br/>
                  <div style={{ background: '#fef2f2', padding: '4px', borderRadius: '4px', border: '1px solid #dc2626' }}>
                    {diagnostics.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
      
      {/* Индикатор в углу */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '32px',
        opacity: 0.3
      }}>
        🌿🌳🍀
      </div>
    </div>
  );
};

export default VKMiniAppMain;
