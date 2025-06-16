import React, { useState } from 'react';
import { useChannels } from '@/hooks/useChannels';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/hooks/useChannels';

interface ChannelFormData {
  name: string;
  username: string;
  chat_id: string;
  invite_link: string;
  channel_type: 'public' | 'private';
  required: boolean;
  app_name: string;
}

export const ChannelManagement: React.FC = () => {
  const { data: channels = [] } = useChannels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState<ChannelFormData>({
    name: '',
    username: '',
    chat_id: '',
    invite_link: '',
    channel_type: 'public',
    required: true,
    app_name: 'druid'
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      console.log('=== СОЗДАНИЕ КАНАЛА ===');
      console.log('Данные канала:', data);

      // Проверяем существование канала с таким же username (если указан)
      if (data.username.trim()) {
        const { data: existingChannel, error: checkError } = await supabase
          .from('channels')
          .select('id, username')
          .eq('username', data.username.trim())
          .maybeSingle();

        if (checkError) {
          console.error('Ошибка проверки существующего канала:', checkError);
          throw new Error('Ошибка проверки существующего канала');
        }

        if (existingChannel) {
          console.log('Канал с таким username уже существует:', existingChannel);
          throw new Error(`Канал с username "${data.username}" уже существует`);
        }
      }

      // Проверяем существование канала с таким же chat_id (если указан)
      if (data.chat_id.trim()) {
        const { data: existingChannel, error: checkError } = await supabase
          .from('channels')
          .select('id, chat_id')
          .eq('chat_id', data.chat_id.trim())
          .maybeSingle();

        if (checkError) {
          console.error('Ошибка проверки существующего канала по chat_id:', checkError);
          throw new Error('Ошибка проверки существующего канала');
        }

        if (existingChannel) {
          console.log('Канал с таким chat_id уже существует:', existingChannel);
          throw new Error(`Канал с chat_id "${data.chat_id}" уже существует`);
        }
      }

      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: data.name,
          username: data.username.trim() || '',
          chat_id: data.chat_id.trim() || null,
          invite_link: data.invite_link.trim() || null,
        })
        .select('id')
        .single();

      if (channelError) {
        console.error('Ошибка создания канала:', channelError);
        throw channelError;
      }

      console.log('Канал создан:', channelData);
      const channelId = channelData.id;

      const appsToInsert = data.app_name === 'both' 
        ? ['cookie', 'druid'] 
        : [data.app_name];
      
      const appChannelInserts = appsToInsert.map(appName => ({
        app: appName,
        channel_id: channelId,
        required: data.required,
      }));

      console.log('Создаем связи с приложениями:', appChannelInserts);

      const { error: appChannelError } = await supabase
        .from('app_channels')
        .insert(appChannelInserts);
      
      if (appChannelError) {
        console.error('Ошибка создания связей с приложениями:', appChannelError);
        // Удаляем созданный канал, если не удалось создать связи
        await supabase.from('channels').delete().eq('id', channelId);
        throw appChannelError;
      }

      console.log('Канал успешно создан с ID:', channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Канал создан",
        description: "Новый канал успешно добавлен.",
      });
    },
    onError: (error) => {
      console.error('Ошибка создания канала:', error);
      const errorMessage = error instanceof Error ? error.message : "Не удалось создать канал";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChannelFormData> }) => {
      const channelUpdateData: { [key: string]: any } = {};
      if (data.name !== undefined) channelUpdateData.name = data.name;
      if (data.username !== undefined) channelUpdateData.username = data.username || '';
      if (data.chat_id !== undefined) channelUpdateData.chat_id = data.chat_id || null;
      if (data.invite_link !== undefined) channelUpdateData.invite_link = data.invite_link || null;

      if (Object.keys(channelUpdateData).length > 0) {
        const { error: channelError } = await supabase
          .from('channels')
          .update(channelUpdateData)
          .eq('id', id);
        if (channelError) throw channelError;
      }

      const appChannelUpdateData: { [key: string]: any } = {};
      if (data.required !== undefined) appChannelUpdateData.required = data.required;
      if (data.app_name && data.app_name !== 'both') appChannelUpdateData.app = data.app_name;

      if (Object.keys(appChannelUpdateData).length > 0) {
        const { error: appChannelError } = await supabase
          .from('app_channels')
          .update(appChannelUpdateData)
          .eq('channel_id', id)
          .eq('app', editingChannel!.app_name);
        if (appChannelError) throw appChannelError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setEditingChannel(null);
      resetForm();
      toast({
        title: "Канал обновлен",
        description: "Канал успешно обновлен.",
      });
    },
    onError: (error) => {
      console.error('Error updating channel:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить канал.",
        variant: "destructive",
      });
    }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (channel: Channel) => {
      const { error } = await supabase
        .from('app_channels')
        .delete()
        .eq('channel_id', channel.id)
        .eq('app', channel.app_name);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast({
        title: "Канал удален",
        description: "Канал успешно удален.",
      });
    },
    onError: (error) => {
      console.error('Error deleting channel:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить канал.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      chat_id: '',
      invite_link: '',
      channel_type: 'public',
      required: true,
      app_name: 'druid'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что для публичных каналов указан username или chat_id
    if (formData.channel_type === "public" && !formData.username.trim() && !formData.chat_id.trim()) {
      toast({
        title: "Ошибка",
        description: "Для публичного канала укажите username или chat_id.",
        variant: "destructive"
      });
      return;
    }

    // Для приватных каналов требуется chat_id
    if (formData.channel_type === "private" && !formData.chat_id.trim()) {
      toast({
        title: "Ошибка",
        description: "Для приватного канала обязательно укажите chat_id.",
        variant: "destructive"
      });
      return;
    }

    if (editingChannel) {
      updateChannelMutation.mutate({ id: editingChannel.id, data: formData });
    } else {
      createChannelMutation.mutate(formData);
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      username: channel.username || '',
      chat_id: channel.chat_id || '',
      invite_link: channel.invite_link || '',
      channel_type: channel.channel_type,
      required: channel.required,
      app_name: channel.app_name
    });
    setIsFormOpen(true);
  };

  const handleDelete = (channel: Channel) => {
    if (confirm('Вы уверены, что хотите удалить связь этого канала с приложением?')) {
      deleteChannelMutation.mutate(channel);
    }
  };

  const handleChannelTypeChange = (value: 'public' | 'private') => {
    if (value === "private") {
      // Очищаем username при выборе приватного канала
      setFormData({ ...formData, channel_type: value, username: '' });
    } else {
      setFormData({ ...formData, channel_type: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Channel Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Управление каналами</h2>
        <Button
          onClick={() => {
            setIsFormOpen(true);
            setEditingChannel(null);
            resetForm();
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить канал</span>
        </Button>
      </div>

      {/* Channel Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingChannel ? 'Редактировать канал' : 'Добавить новый канал'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название канала</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="channel_type">Тип канала</Label>
                  <Select value={formData.channel_type} onValueChange={(value) => handleChannelTypeChange(value as 'public' | 'private')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Публичный</SelectItem>
                      <SelectItem value="private">Приватный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="username">
                    Username (без @) {formData.channel_type === 'private' && '(не используется)'}
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={formData.channel_type === "private"}
                    placeholder={formData.channel_type === "private" ? "Не требуется для приватных каналов" : "username без @"}
                  />
                </div>
                <div>
                  <Label htmlFor="chat_id">
                    Chat ID {formData.channel_type === 'private' && '(обязательно)'}
                  </Label>
                  <Input
                    id="chat_id"
                    value={formData.chat_id}
                    onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                    placeholder="Например: -1001234567890"
                    required={formData.channel_type === 'private'}
                  />
                </div>
                <div>
                  <Label htmlFor="invite_link">Ссылка-приглашение</Label>
                  <Input
                    id="invite_link"
                    value={formData.invite_link}
                    onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
                    placeholder="https://t.me/..."
                  />
                </div>
                <div>
                  <Label htmlFor="app_name">Приложение</Label>
                  <Select value={formData.app_name} onValueChange={(value) => setFormData({ ...formData, app_name: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cookie">Cookie</SelectItem>
                      <SelectItem value="druid">Druid</SelectItem>
                      <SelectItem value="both">Оба приложения</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                />
                <Label htmlFor="required">Обязательная подписка</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createChannelMutation.isPending || updateChannelMutation.isPending}
                >
                  {editingChannel ? 'Обновить' : 'Создать'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingChannel(null);
                    resetForm();
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Channels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список каналов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Chat ID</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Приложение</TableHead>
                <TableHead>Обязательный</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={`${channel.id}-${channel.app_name}`}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>{channel.username ? `@${channel.username}`: '-'}</TableCell>
                  <TableCell className="text-xs">{channel.chat_id || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={channel.channel_type === 'public' ? 'default' : 'secondary'}>
                      {channel.channel_type === 'public' ? 'Публичный' : 'Приватный'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{channel.app_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={channel.required ? 'default' : 'secondary'}>
                      {channel.required ? 'Да' : 'Нет'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {channel.invite_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(channel.invite_link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(channel)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(channel)}
                        disabled={deleteChannelMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {channels.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Каналы не найдены. Добавьте первый канал.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
