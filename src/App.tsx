import './App.css'
import MapComponent from './components/MapComponent'
import ImageLightbox from './components/ImageLightbox';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
      <Routes>
        <Route path="/" element={<MapComponent />}/>
        {/* <Route path="tree/:treeId" element={<MapComponent />}/>
        <Route path="neighbourhood/:mapId" element={<MapComponent />}/>
        <Route path="user-photo/:photoId" element={<MapComponent />}/> */}
        {/* <ImageLightbox /> */}
      </Routes>
  )
}

export default App;
