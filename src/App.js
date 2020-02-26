import React from 'react';
import './App.css';
import Skyss from './Skyss';
import { CookiesProvider } from 'react-cookie';



function App() {
  
  return (
    <CookiesProvider>
    <div className="App">
      <header className="App-header">
        <Skyss />
      </header>
    </div>
    </CookiesProvider>
  );
}





export default App;
