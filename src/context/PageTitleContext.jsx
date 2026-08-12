import React, { createContext, useContext, useState, useCallback } from 'react';

const PageTitleContext = createContext({ title: '', description: '', setPage: () => {} });

export const usePageTitle = () => useContext(PageTitleContext);

export const PageTitleProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const setPage = useCallback((t, d = '') => {
    setTitle(t);
    setDescription(d);
  }, []);

  return (
    <PageTitleContext.Provider value={{ title, description, setPage }}>
      {children}
    </PageTitleContext.Provider>
  );
};
