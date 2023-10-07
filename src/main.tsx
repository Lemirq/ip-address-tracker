import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
