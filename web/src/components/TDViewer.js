// src/ThreeDViewer.js
import React, { Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FBXLoader } from 'three-stdlib';

const Model = ({ modelPath }) => {
  const fbx = useLoader(FBXLoader, modelPath);
  const ref = useRef();

  return <primitive object={fbx} ref={ref} />;
};

const ThreeDViewer = ({ modelPath }) => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Suspense fallback={null}>
        <Model modelPath={modelPath} />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
};

export default ThreeDViewer;
