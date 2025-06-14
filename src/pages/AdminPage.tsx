import React, { useState, useEffect } from 'react';
import { useChannels } from '@/hooks/useChannels';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { ChannelManagement } from '@/components/admin/ChannelManagement';
import { SystemLogs } from '@/components/admin/SystemLogs';
import { UserLoginHistory } from '@/components/admin/UserLoginHistory';
import { LogsViewer } from '@/components/admin/LogsViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, BarChart3, Shield, FileText, UserCheck, Activity } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SubscriptionCheckLogs } from '@/components/admin/SubscriptionCheckLogs';
import { AdminDruidSigns } from "@/components/admin/AdminDruidSigns";
import { UploadDruidTextsPDF } from "@/components/admin/UploadDruidTextsPDF";

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { logAdminAction } = useAdminLogs();

  // Логируем загрузку админ-панели
  useEffect(() => {
    const startTime = Date.now();
    
    logAdminAction({
      log_type: 'user_load',
      operation: 'load_admin_panel',
      details: {
        page: 'admin',
        timestamp: new Date().toISOString(),
      },
      execution_time_ms: Date.now() - startTime,
      success: true,
    });
  }, [logAdminAction]);

  // Логируем переключение вкладок
  const handleTabChange = (tabValue: string) => {
    logAdminAction({
      log_type: 'filter_action',
      operation: 'switch_admin_tab',
      details: {
        from_tab: activeTab,
        to_tab: tabValue,
        timestamp: new Date().toISOString(),
      },
      success: true,
    });
    
    setActiveTab(tabValue);
  };

  if (channelsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          </div>
          <p className="text-gray-600">
            Управление каналами и мониторинг системы
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего каналов</p>
                  <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Обязательные каналы</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {channels.filter(c => c.required).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные каналы</p>
                  <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white">
            <TabsTrigger value="channels" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Каналы</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Старые логи</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Мониторинг</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Настройки</span>
            </TabsTrigger>
            <TabsTrigger value="subscription-checks" className="flex items-center space-x-2">
              <span className="font-semibold">Проверки подписок</span>
            </TabsTrigger>
            <TabsTrigger value="druid-signs" className="flex items-center space-x-2">
              <span className="font-semibold">Друидские знаки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels">
            <ChannelManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserLoginHistory />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>

          <TabsContent value="monitoring">
            <LogsViewer />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Настройки приложения</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Здесь будут общие настройки приложения
                </p>
                <Button variant="outline" disabled>
                  Скоро появится
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription-checks">
            <Card>
              <CardHeader>
                <CardTitle>Логи проверки подписки пользователей</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionCheckLogs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="druid-signs">
            <UploadDruidTextsPDF />
            <AdminDruidSigns />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
