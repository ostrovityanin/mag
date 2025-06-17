
import React from 'react';
import { CookieEntryPage } from './CookieEntryPage';

// Обратная совместимость - перенаправляем на страницу входа
export const CookiePage: React.FC = () => {
  return <CookieEntryPage />;
};
