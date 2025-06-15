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
  channel_type: string;
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
    app_name: 'astro_cookie'
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      const { error } = await supabase
        .from('required_channels')
        .insert([data]);
      
      if (error) throw error;
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
      console.error('Error creating channel:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать канал.",
        variant: "destructive",
      });
    }
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChannelFormData> }) => {
      const { error } = await supabase
        .from('required_channels')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('required_channels')
        .delete()
        .eq('id', id);
      
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
      app_name: 'astro_cookie'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Не даём отправить форму без username только если тип public
    if (formData.channel_type === "public" && !formData.username.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите username для публичного канала.",
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
      username: channel.username,
      chat_id: channel.chat_id || '',
      invite_link: channel.invite_link || '',
      channel_type: channel.channel_type,
      required: channel.required,
      app_name: channel.app_name
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот канал?')) {
      deleteChannelMutation.mutate(id);
    }
  };

  const handleChannelTypeChange = (value: string) => {
    if (value === "private") {
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
                  <Label htmlFor="username">
                    Username (без @)
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={formData.channel_type === "public"}
                    disabled={formData.channel_type === "private"}
                    placeholder={formData.channel_type === "private" ? "Не требуется для приватных каналов" : ""}
                  />
                  {formData.channel_type === "private" && (
                    <span className="text-xs text-gray-500">Не требуется для приватных каналов</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="chat_id">Chat ID</Label>
                  <Input
                    id="chat_id"
                    value={formData.chat_id}
                    onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="invite_link">Ссылка-приглашение</Label>
                  <Input
                    id="invite_link"
                    value={formData.invite_link}
                    onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="channel_type">Тип канала</Label>
                  <Select value={formData.channel_type} onValueChange={handleChannelTypeChange}>
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
                  <Label htmlFor="app_name">Приложение</Label>
                  <Select value={formData.app_name} onValueChange={(value) => setFormData({ ...formData, app_name: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="astro_cookie">Astro Cookie</SelectItem>
                      <SelectItem value="druid_horoscope">Druid Horoscope</SelectItem>
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
                <TableHead>Тип</TableHead>
                <TableHead>Приложение</TableHead>
                <TableHead>Обязательный</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>@{channel.username}</TableCell>
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
                        onClick={() => handleDelete(channel.id)}
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
