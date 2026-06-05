import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ConfigPanel from './pages/ConfigPanel'
import PrintEngine from './pages/PrintEngine'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConfigPanel />} />
        <Route path="/print" element={<PrintEngine />} />
      </Routes>
    </Router>
  )
}

export default App
