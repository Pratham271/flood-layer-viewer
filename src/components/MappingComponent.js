import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

const MapComponent = () => {
  const [tiffOptions, setTiffOptions] = useState([]);
  const [selectedTiff, setSelectedTiff] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchGeoTIFFOptions();
    createMap();

    return () => {
      // Clean up map instance when component is unmounted
      mapRef.current.setTarget(null);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedTiff) {
      addTiffLayer(selectedTiff);
    }
  }, [selectedTiff]);

  const fetchGeoTIFFOptions = () => {
    const options = ['pro_aug21', 'pro_aug27', 'pro_sep02'];
    setTiffOptions(options);
  };

  const createMap = () => {
    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          }),
        }),
      ],
      view: new View({
        center: [0,0], // Set the center to Kerala coordinates [longitude, latitude]
        zoom: 0, // Adjust the zoom level as needed
      }),
    });

    mapRef.current = map;
  };

  const addTiffLayer = (selectedOption) => {
    const map = mapRef.current;

    const layersToRemove = map.getLayers().getArray().filter((layer) => layer instanceof ImageLayer);
    layersToRemove.forEach((layer) => {
      map.removeLayer(layer);
    });

    try {
      const tiffLayer = new ImageLayer({
        source: new ImageWMS({
          url: 'http://143.110.254.173/geoserver/wms',
          params: {
            LAYERS: `Flood:${selectedOption}`,
            FORMAT: 'image/png',
          },
          serverType: 'geoserver',
        }),
      });

      map.addLayer(tiffLayer);

      // Zoom to the extent of the layer
      const tiffSource = tiffLayer.getSource();
      tiffSource.once('imageloadend', () => {
        const extent = tiffSource.getExtent();
        map.getView().fit(extent, { duration: 1000 });
      });
    } catch (error) {
      console.error('Failed to add GeoTIFF layer:', error);
    }
  };

  const handleTiffChange = (event) => {
    const selectedOption = event.target.value;
    setSelectedTiff(selectedOption);
  };

  return (
    <div>
      <select value={selectedTiff} onChange={handleTiffChange}>
        <option value="">Select a GeoTIFF file</option>
        {tiffOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default MapComponent;
