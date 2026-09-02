import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import SpeciesDetail from './pages/SpeciesDetail.jsx'
import KingdomPage from './pages/KingdomPage.jsx'
import Gallery3D from './pages/Gallery3D.jsx'
import FamilyTree from './pages/FamilyTree.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="species/:slug" element={<SpeciesDetail />} />
          <Route path="kingdom/:kingdomId" element={<KingdomPage />} />
          <Route path="3d-gallery" element={<Gallery3D />} />
          <Route path="family-tree" element={<FamilyTree />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
