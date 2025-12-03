import React from 'react';
import { FlowEditor } from './components/App/FlowEditor';

const App: React.FC = () => {
  return (
    <main className="w-full h-full bg-surface-1">
      <FlowEditor />
    </main>
  );
};

export default App;