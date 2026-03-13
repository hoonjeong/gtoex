import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupPage from './components/setup/SetupPage';
import PlayPage from './components/play/PlayPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/play" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}
