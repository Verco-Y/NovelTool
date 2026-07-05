import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ArchiveProvider } from './context/ArchiveContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CharacterDetail from './pages/CharacterDetail';
import ClanManager from './pages/ClanManager';
import BackupCenter from './pages/BackupCenter';

export default function App() {
  return (
    <BrowserRouter>
      <ArchiveProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="character/:id" element={<CharacterDetail />} />
            <Route path="clans" element={<ClanManager />} />
            <Route path="backup" element={<BackupCenter />} />
          </Route>
        </Routes>
      </ArchiveProvider>
    </BrowserRouter>
  );
}