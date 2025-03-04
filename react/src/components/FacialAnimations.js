import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function FacialAnimations({ audioUrl, text }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animationsRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the 3D scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Setup scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      45, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 1.5, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add orbit controls for user interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;

    // Load 3D model (head/face)
    const loader = new GLTFLoader();
    loader.load(
      '/models/face_model.glb', // Path to your face model
      (gltf) => {
        scene.add(gltf.scene);
        modelRef.current = gltf.scene;
        
        // Setup animation mixer
        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;
        
        // Store animations for later use
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach(animation => {
            animationsRef.current[animation.name] = mixer.clipAction(animation);
          });
        } else {
          console.warn('No animations found in the model');
          // Create a default animation if none exist
          createDefaultAnimations();
        }
        
        setIsLoading(false);
      },
      (progress) => {
        console.log('Loading model:', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        setError('Failed to load facial model');
        setIsLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update mixer
      if (mixerRef.current) {
        mixerRef.current.update(clockRef.current.getDelta());
      }
      
      // Update controls
      controls.update();
      
      // Render scene
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Create default talking animations if none are provided by the model
  const createDefaultAnimations = () => {
    if (!modelRef.current || !mixerRef.current) return;
    
    // Find jaw or mouth bones in the model
    let jawBone = null;
    modelRef.current.traverse((child) => {
      if (child.isBone && (
          child.name.toLowerCase().includes('jaw') || 
          child.name.toLowerCase().includes('mouth')
        )) {
        jawBone = child;
      }
    });
    
    if (jawBone) {
      // Create a simple talking animation
      const track = new THREE.QuaternionKeyframeTrack(
        `${jawBone.name}.quaternion`,
        [0, 0.1, 0.2, 0.3, 0.4], 
        [
          jawBone.quaternion.x, jawBone.quaternion.y, jawBone.quaternion.z, jawBone.quaternion.w,
          jawBone.quaternion.x, jawBone.quaternion.y + 0.1, jawBone.quaternion.z, jawBone.quaternion.w,
          jawBone.quaternion.x, jawBone.quaternion.y, jawBone.quaternion.z, jawBone.quaternion.w,
          jawBone.quaternion.x, jawBone.quaternion.y + 0.1, jawBone.quaternion.z, jawBone.quaternion.w,
          jawBone.quaternion.x, jawBone.quaternion.y, jawBone.quaternion.z, jawBone.quaternion.w,
        ]
      );
      
      const clip = new THREE.AnimationClip('talking', 0.5, [track]);
      animationsRef.current['talking'] = mixerRef.current.clipAction(clip);
      
      // Create a neutral pose
      const neutralTrack = new THREE.QuaternionKeyframeTrack(
        `${jawBone.name}.quaternion`,
        [0], 
        [jawBone.quaternion.x, jawBone.quaternion.y, jawBone.quaternion.z, jawBone.quaternion.w]
      );
      
      const neutralClip = new THREE.AnimationClip('neutral', 0.5, [neutralTrack]);
      animationsRef.current['neutral'] = mixerRef.current.clipAction(neutralClip);
    }
  };

  // Process audio and text for lip-sync animation
  useEffect(() => {
    if (!audioUrl || !text || !modelRef.current || !animationsRef.current) return;

    // Process the text to determine mouth shapes (visemes)
    const processLipSync = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/lip-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            audioUrl
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        // Apply animation data
        applyLipSyncData(data.lipSync);
      } catch (error) {
        console.error('Error processing lip-sync:', error);
        // Fall back to basic talking animation
        playBasicTalkingAnimation();
      }
    };
    
    const playBasicTalkingAnimation = () => {
      if (animationsRef.current['talking']) {
        animationsRef.current['talking'].reset().setLoop(THREE.LoopRepeat).play();
        
        // Get audio duration and stop animation when audio ends
        const audio = new Audio(audioUrl);
        audio.addEventListener('loadedmetadata', () => {
          // Stop animation after audio duration + small buffer
          setTimeout(() => {
            animationsRef.current['talking'].fadeOut(0.5);
            if (animationsRef.current['neutral']) {
              animationsRef.current['neutral'].reset().fadeIn(0.5).play();
            }
          }, (audio.duration * 1000) + 500);
        });
        audio.load();
      }
    };
    
    processLipSync();
    
    // Simple audio playback to start animations
    const audio = new Audio(audioUrl);
    audio.addEventListener('play', () => {
      // Start basic talking animation if no lip-sync data available yet
      if (animationsRef.current['talking']) {
        animationsRef.current['talking'].reset().play();
      }
    });
    
    audio.addEventListener('ended', () => {
      // Stop animations when audio ends
      if (animationsRef.current['talking']) {
        animationsRef.current['talking'].fadeOut(0.5);
      }
      // Return to neutral face
      if (animationsRef.current['neutral']) {
        animationsRef.current['neutral'].reset().fadeIn(0.5).play();
      }
    });
    
    audio.play().catch(err => console.error('Error playing audio:', err));
    
    return () => {
      audio.pause();
      audio.removeAttribute('src');
    };
  }, [audioUrl, text]);

  // Function to apply lip-sync data from the backend
  const applyLipSyncData = (lipSyncData) => {
    if (!mixerRef.current || !animationsRef.current || !lipSyncData || !lipSyncData.length) {
      // Fall back to basic talking animation if no proper lip sync data
      if (animationsRef.current['talking']) {
        animationsRef.current['talking'].reset().play();
      }
      return;
    }
    
    // Reset any active animations
    Object.values(animationsRef.current).forEach(action => {
      action.fadeOut(0.2);
    });
    
    // Process each viseme keyframe
    lipSyncData.forEach(frame => {
      // Schedule viseme animations based on timestamp
      setTimeout(() => {
        if (!mixerRef.current || !animationsRef.current) return;
        
        // Find viseme animation or create one on the fly
        const viseme = frame.viseme;
        if (!animationsRef.current[viseme] && modelRef.current) {
          // Dynamically create viseme animation if it doesn't exist
          createVisemeAnimation(viseme, frame.intensity);
        }
        
        if (animationsRef.current[viseme]) {
          // Play the viseme animation
          const action = animationsRef.current[viseme];
          action.fadeIn(0.1).play();
          
          // Hold viseme for duration then fade out
          setTimeout(() => {
            action.fadeOut(0.1);
          }, frame.duration);
        }
      }, frame.time);
    });
  };
  
  // Create a viseme animation dynamically
  const createVisemeAnimation = (viseme, intensity) => {
    // Find mouth/jaw bones
    let jawBone = null, lipUpperBone = null, lipLowerBone = null;
    
    modelRef.current.traverse((child) => {
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes('jaw')) jawBone = child;
        if (name.includes('lip') && name.includes('upper')) lipUpperBone = child;
        if (name.includes('lip') && name.includes('lower')) lipLowerBone = child;
      }
    });
    
    // Simple mapping of visemes to bone movements
    // In a real app, you'd have a more sophisticated mapping
    const createVisemeTrack = (bone, rotationFactor) => {
      if (!bone) return null;
      
      // Base rotation + intensity-based additional rotation
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          0,
          0,
          rotationFactor * intensity * 0.2,
          'XYZ'
        )
      );
      
      return new THREE.QuaternionKeyframeTrack(
        `${bone.name}.quaternion`,
        [0, 0.1], 
        [
          rotation.x, rotation.y, rotation.z, rotation.w,
          rotation.x, rotation.y, rotation.z, rotation.w
        ]
      );
    };
    
    const tracks = [];
    
    // Add jaw track if jaw bone exists
    if (jawBone) {
      const track = createVisemeTrack(jawBone, viseme.includes('open') ? 1 : 0.5);
      if (track) tracks.push(track);
    }
    
    // Add lip tracks if they exist
    if (lipUpperBone) {
      const track = createVisemeTrack(lipUpperBone, viseme.includes('round') ? 1 : 0.3);
      if (track) tracks.push(track);
    }
    
    if (lipLowerBone) {
      const track = createVisemeTrack(lipLowerBone, viseme.includes('open') ? 1 : 0.3);
      if (track) tracks.push(track);
    }
    
    if (tracks.length > 0) {
      const clip = new THREE.AnimationClip(viseme, 0.2, tracks);
      animationsRef.current[viseme] = mixerRef.current.clipAction(clip);
    }
  };
  
  return (
    <div className="facial-animations">
      {isLoading && <div className="loading">Loading 3D model...</div>}
      {error && <div className="error">{error}</div>}
      <div 
        ref={mountRef} 
        className="animation-container"
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
}