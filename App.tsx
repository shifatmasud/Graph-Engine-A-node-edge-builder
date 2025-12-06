import React from 'react';
import { FlowEditor } from './components/App/FlowEditor';
import { ThemeProvider } from './components/Core/ThemeContext';

const App = () => {
  const styles = {
    main: {
      width: '100%',
      height: '100%',
    },
  };

  return (
    <ThemeProvider>
      <main style={styles.main}>
        <FlowEditor />
      </main>
    </ThemeProvider>
  );
};

export default App;