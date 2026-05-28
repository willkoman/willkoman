import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './routes/Home';
import Editor from './routes/Editor';
import Library from './routes/Library';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </AppShell>
  );
}
