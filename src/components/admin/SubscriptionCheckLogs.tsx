
import React from 'react';
import { useSubscriptionCheckLogs } from '@/hooks/useSubscriptionCheckLogs';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { BadgeCheck, XCircle } from 'lucide-react';

export const SubscriptionCheckLogs: React.FC<{ appCode?: string }> = ({ appCode }) => {
  const { data: logs = [], isLoading, error } = useSubscriptionCheckLogs(appCode);

  // Собираем список всех каналов в прогоне
  const allChannels: string[] = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach(log => {
      Object.keys(log.channel_check_results || {}).forEach(ch => set.add(ch));
    });
    return Array.from(set);
  }, [logs]);

  if (isLoading) {
    return <div className="text-center text-gray-500">Загрузка истории проверок...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600">Ошибка при загрузке: {error.message}</div>;
  }
  if (!logs.length) {
    return <div className="text-center text-gray-500">Нет данных о проверках подписок.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Время</TableHead>
            <TableHead>Telegram ID</TableHead>
            <TableHead>Username</TableHead>
            {allChannels.map(ch => (
              <TableHead key={ch} className="whitespace-nowrap">{ch}</TableHead>
            ))}
            <TableHead>App Code</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="text-[13px]">{new Date(log.checked_at).toLocaleString()}</TableCell>
              <TableCell>{log.telegram_user_id}</TableCell>
              <TableCell>{log.username || '-'}</TableCell>
              {allChannels.map(ch =>
                <TableCell key={ch} className="text-center">
                  {log.channel_check_results[ch] === true ? (
                    <span title="Подписан">
                      <BadgeCheck className="inline h-5 w-5 text-green-600" />
                    </span>
                  ) : (
                    <span title="Не подписан">
                      <XCircle className="inline h-5 w-5 text-red-500" />
                    </span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-[12px]">{log.app_code}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-2 text-xs text-gray-500">
        Показываются последние {logs.length} проверок.
      </div>
    </div>
  );
};
