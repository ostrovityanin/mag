
import React, { useState } from 'react';
import { useChannels } from '@/hooks/useChannels';
import { ChannelManagement } from '@/components/admin/ChannelManagement';
import { SystemLogs } from '@/components/admin/SystemLogs';
import { UserLoginHistory } from '@/components/admin/UserLoginHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, BarChart3, Shield, FileText, UserCheck } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const { data: channels = [], isLoading: channelsLoading } = useChannels();

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
            Управление каналами и настройками приложения
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="channels" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Управление каналами</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Системные логи</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Настройки</span>
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
        </Tabs>
      </div>
    </div>
  );
};
