// public/scenarios/SceneLunarEclipse.js

import { Planet } from '../planet.js';

/**
 * 월식 장면을 초기화합니다. (Sun -> Earth -> Moon 정렬)
 * @returns {Object} { planets: Planet[], cameraPosition: {x, y, z} }
 */
export function initLunarEclipseScene(scene, world, loader, aiData) {
    console.log("🌕 [SceneLunarEclipse] 함수 실행되었습니다.");
    const planets = [];
    const SCENARIO_TYPE = 'lunar_eclipse';

    // --- 설정 상수 ---
    const SCALE_DISTANCE = 30; 
    const SCALE_SIZE = 1;      

    // --- 기본 천체 데이터 ---
    const sunData = { name: 'Sun', textureKey: 'Sun', size: SCALE_SIZE * 20, mass: 10000 };
    const earthData = { name: 'Earth', textureKey: 'Earth', size: SCALE_SIZE * 1.5, mass: 100 };
    const moonData = { name: 'Moon', textureKey: 'Moon', size: SCALE_SIZE * 0.5, mass: 5 };

    // --- 1. 위치/속도 설정 (월식 정렬) ---
    
    // A. 태양: 멀리 떨어진 광원
    sunData.position = { x: 0, y: 0, z: -SCALE_DISTANCE * 10 };
    sunData.velocity = { x: 0, y: 0, z: 0 };

    // B. 지구: 그림자를 만드는 주체 (태양과 달 사이)
    earthData.position = { x: 0, y: 0, z: -SCALE_DISTANCE * 1 }; 
    earthData.velocity = { x: 0, y: 0, z: 0 }; 

    // C. 달: 지구 그림자 영역에 위치 (지구 뒤)
    moonData.position = { x: 0, y: 0, z: 0 }; 
    moonData.velocity = { x: 0.2, y: 0, z: 0 }; // 서서히 그림자 속으로 진입

    // --- 2. 행성 생성 ---
    // Planet 클래스 생성 시 내부적으로 Three.js Mesh와 CANNON.js Body가 생성됩니다.
    const sun = new Planet(scene, world, loader, sunData, SCENARIO_TYPE);
    const earth = new Planet(scene, world, loader, earthData, SCENARIO_TYPE);
    const moon = new Planet(scene, world, loader, moonData, SCENARIO_TYPE);
    
    planets.push(sun, earth, moon);

    // --- 3. 그림자 설정 (핵심 로직) ---
    // main.js에서 sunLight.castShadow = true;가 설정되었다고 가정합니다.
    
    // 지구: 그림자를 던져야 함
    if (earth.mesh) {
        earth.mesh.castShadow = true; 
        console.log("✅ 지구 castShadow 활성화.");
    }

    // 달: 지구의 그림자를 받아야 함
    if (moon.mesh) {
        moon.mesh.receiveShadow = true;
        console.log("✅ 달 receiveShadow 활성화.");
    }

    // --- 4. 카메라 설정 ---
    const cameraPosition = { x: 0, y: SCALE_SIZE * 10, z: -SCALE_DISTANCE * 3 }; 

    return { 
        planets, 
        cameraPosition
    };
}