import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

interface CADViewerProps {
  modelUrl?: string;
  partName?: string;
  showFallback?: boolean;
}

export const CADViewer: React.FC<CADViewerProps> = ({ 
  modelUrl, 
  partName = 'Part',
  showFallback = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Babylon.js engine and scene
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Set up camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2.5,
      100,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;

    // Set up lighting
    const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;

    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(10, 20, 10), scene);
    light2.intensity = 0.5;

    // Set background
    scene.clearColor = new BABYLON.Color4(0.95, 0.95, 0.95, 1);

    // Load model if URL provided
    if (modelUrl) {
      BABYLON.SceneLoader.ImportMesh(
        '',
        modelUrl.substring(0, modelUrl.lastIndexOf('/') + 1),
        modelUrl.substring(modelUrl.lastIndexOf('/') + 1),
        scene,
        (meshes) => {
          // Auto-fit camera to model
          if (meshes.length > 0) {
            scene.createDefaultEnvironment();
            // Calculate bounding box manually
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            meshes.forEach(mesh => {
              if (mesh.getBoundingInfo) {
                const bounds = mesh.getBoundingInfo();
                minX = Math.min(minX, bounds.minimum.x);
                minY = Math.min(minY, bounds.minimum.y);
                minZ = Math.min(minZ, bounds.minimum.z);
                maxX = Math.max(maxX, bounds.maximum.x);
                maxY = Math.max(maxY, bounds.maximum.y);
                maxZ = Math.max(maxZ, bounds.maximum.z);
              }
            });
            
            const center = new BABYLON.Vector3(
              (minX + maxX) / 2,
              (minY + maxY) / 2,
              (minZ + maxZ) / 2
            );
            const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
            camera.radius = size * 1.5;
            camera.target = center;
          }
        },
        undefined,
        (scene, message, exception) => {
          console.error('Error loading model:', message, exception);
        }
      );
    } else {
      // Show message instead of generic box - encourage upgrade to Digital Twin
      console.log('[CADViewer] No model URL provided - showing upgrade message');
    }

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [modelUrl]);

  if (showFallback) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd',
        color: '#666',
        fontSize: '14px',
        textAlign: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ marginBottom: '8px', fontWeight: '600' }}>3D Visualization</div>
          <div style={{ fontSize: '12px' }}>Upload CAD file (STEP, IGES, STL) for 3D model visualization</div>
          <div style={{ fontSize: '11px', marginTop: '8px', color: '#999' }}>Currently showing 2D orthographic drawings</div>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        display: 'block'
      }}
    />
  );
};
