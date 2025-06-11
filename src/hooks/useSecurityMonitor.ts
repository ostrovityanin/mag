
import { useAdminLogs } from './useAdminLogs';

export const useSecurityMonitor = () => {
  const { logSecurityEvent } = useAdminLogs();

  const checkForTestUser = (telegramId: number, username?: string) => {
    console.log('=== ПРОВЕРКА НА ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ ===');
    console.log('Telegram ID:', telegramId);
    console.log('Username:', username);

    // Проверяем на подозрительные ID
    const suspiciousIds = [123456789, 999999999, 111111111, 777777777];
    const isTestId = suspiciousIds.includes(telegramId);
    
    // Проверяем на тестовые имена пользователей
    const suspiciousUsernames = ['test', 'testuser', 'demo', 'sample'];
    const isTestUsername = username && suspiciousUsernames.some(sus => 
      username.toLowerCase().includes(sus)
    );

    if (isTestId || isTestUsername) {
      console.warn('ОБНАРУЖЕН ТЕСТОВЫЙ ПОЛЬЗОВАТЕЛЬ!');
      
      logSecurityEvent({
        event_type: 'test_user_blocked',
        severity: 'high',
        description: `Попытка использования тестового пользователя: ID=${telegramId}, username=${username}`,
        context: {
          telegram_id: telegramId,
          username: username,
          reason: isTestId ? 'suspicious_id' : 'suspicious_username',
          detected_at: new Date().toISOString(),
        },
        telegram_user_id: telegramId,
        blocked_action: 'user_authentication',
      });

      return { isTestUser: true, reason: isTestId ? 'ID' : 'Username' };
    }

    return { isTestUser: false };
  };

  const logSuspiciousAuth = (telegramId: number, error: string) => {
    console.log('=== ПОДОЗРИТЕЛЬНАЯ АУТЕНТИФИКАЦИЯ ===');
    
    logSecurityEvent({
      event_type: 'suspicious_auth',
      severity: 'medium',
      description: `Неудачная попытка аутентификации: ${error}`,
      context: {
        telegram_id: telegramId,
        error_message: error,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
      telegram_user_id: telegramId,
    });
  };

  const logUnauthorizedAccess = (attemptedAction: string, currentUserTelegramId?: number) => {
    console.log('=== НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП ===');
    
    logSecurityEvent({
      event_type: 'unauthorized_access',
      severity: 'critical',
      description: `Попытка несанкционированного доступа к: ${attemptedAction}`,
      context: {
        attempted_action: attemptedAction,
        current_user: currentUserTelegramId,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
      },
      telegram_user_id: currentUserTelegramId,
      blocked_action: attemptedAction,
    });
  };

  const logDataAccess = (dataType: string, recordCount: number, currentUserTelegramId?: number) => {
    console.log('=== ДОСТУП К ДАННЫМ ===');
    
    logSecurityEvent({
      event_type: 'data_access',
      severity: 'low',
      description: `Доступ к данным: ${dataType}, количество записей: ${recordCount}`,
      context: {
        data_type: dataType,
        record_count: recordCount,
        accessed_by: currentUserTelegramId,
        timestamp: new Date().toISOString(),
      },
      telegram_user_id: currentUserTelegramId,
    });
  };

  return {
    checkForTestUser,
    logSuspiciousAuth,
    logUnauthorizedAccess,
    logDataAccess,
  };
};
