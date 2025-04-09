import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import { ROUTES } from '../shared/enums/routes';
import MainPage from '../layout/MainPage';
import SettingsPage from '../layout/SettingsPage';
import ListeningOverlay from '../layout/ListeningOverlay';

import '../styles/index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.MAIN} element={<MainPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.LISTENING} element={<ListeningOverlay />} />
      </Routes>
    </Router>
  );
}
