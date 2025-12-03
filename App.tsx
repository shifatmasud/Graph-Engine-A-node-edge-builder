import React from 'react';
import { FlowEditor } from './components/App/FlowEditor';
import { ThemeProvider } from './components/Core/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <main className="w-full h-full">
        <FlowEditor />
      </main>
    </ThemeProvider>
  );
};

export default App;