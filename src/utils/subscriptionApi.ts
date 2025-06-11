
// Простая утилита для проверки подписки
export const checkUserSubscription = async (userId: number, channelId: string): Promise<boolean> => {
  try {
    console.log('=== ПРОВЕРКА ПОДПИСКИ ЧЕРЕЗ API ===');
    console.log('User ID:', userId);
    console.log('Channel ID:', channelId);

    // Вызываем Supabase edge function
    const response = await fetch('https://shytgcmkvycrpzhlsfbc.supabase.co/functions/v1/simple-check-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeXRnY21rdnljcnB6aGxzZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDE0NDUsImV4cCI6MjA2NDUxNzQ0NX0.yAxuIxp9YEPRT6-iSybXev3hY6Kcmns3-cS3EWXf-X4`,
      },
      body: JSON.stringify({
        userId: userId.toString(),
        channelId,
      }),
    });

    if (!response.ok) {
      console.error('Ошибка HTTP:', response.status);
      return false;
    }

    const result = await response.json();
    console.log('Результат проверки:', result);
    
    return result.isSubscribed || false;
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
};
