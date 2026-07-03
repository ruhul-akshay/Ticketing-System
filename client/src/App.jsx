import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { useThemeStore } from './store/useThemeStore';

function App() {
  const { theme, primaryColor, accentColor, applyCurrentStyles } = useThemeStore();

  useEffect(() => {
    applyCurrentStyles();
  }, [theme, primaryColor, accentColor, applyCurrentStyles]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
