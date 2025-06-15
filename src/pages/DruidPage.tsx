
import React from 'react';
import { DruidEntryPage } from './DruidEntryPage';

// Обратная совместимость - перенаправляем на страницу входа
export const DruidPage: React.FC = () => {
  return <DruidEntryPage />;
};
