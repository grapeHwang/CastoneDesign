// public/scenarios/SceneSolarEclipse.js

import { Planet } from '../planet.js';
import * as THREE from 'three'; // ✨ THREE 객체를 사용하려면 import 필요

/**
 * 개기일식 장면을 초기화합니다. (Sun -> Moon -> Earth 정렬)
 * @returns {Object} { planets: Planet[], cameraPosition: {x, y, z} }
 */
export function initSolarEclipseScene(scene, world, loader, aiData) {
    console.log("🌑 [SceneSolarEclipse] 함수 실행되었습니다.");
    const planets = [];
    const SCENARIO_TYPE = 'solar_eclipse';

    // --- 설정 상수 ---
    const SCALE_DISTANCE = 30; 
    const SCALE_SIZE = 1;      

    // --- 기본 천체 데이터 ---
    const sunData = { name: 'Sun', textureKey: 'Sun', size: SCALE_SIZE * 20, mass: 10000 };
    const earthData = { name: 'Earth', textureKey: 'Earth', size: SCALE_SIZE * 1.5, mass: 100 };
    const moonData = { name: 'Moon', textureKey: 'Moon', size: SCALE_SIZE * 0.5, mass: 5 };

    // --- 1. 위치/속도 설정 (일식 정렬) ---
    
    // A. 태양: 멀리 떨어진 광원 (Z축 음수 방향)
    sunData.position = { x: 0, y: 0, z: -SCALE_DISTANCE * 10 }; 
    sunData.velocity = { x: 0, y: 0, z: 0 };

    // B. 지구: 관찰 기준점 (중앙)
    earthData.position = { x: 0, y: 0, z: 0 };
    earthData.velocity = { x: 0, y: 0, z: 0 }; 

    // C. 달: 지구와 태양 사이에 위치하여 태양을 가림
    moonData.position = { x: 0, y: 0, z: -SCALE_SIZE * 5 }; 
    moonData.velocity = { x: 0.2, y: 0, z: 0 }; // 서서히 이동하며 일식 진행

    // --- 2. 행성 생성 ---

    const sun = new Planet(scene, world, loader, sunData, SCENARIO_TYPE);
    const earth = new Planet(scene, world, loader, earthData, SCENARIO_TYPE);
    const moon = new Planet(scene, world, loader, moonData, SCENARIO_TYPE);

    planets.push(sun, earth, moon); // 인스턴스를 배열에 추가

    const solarLight = new THREE.PointLight(0xffffff, 50, 10000)

    // 강한 태양광(백색)을 설정합니다.
    if (sun.body) {
        solarLight.position.copy(sun.body.position); 
    } else {
        solarLight.position.set(sunData.position.x, sunData.position.y, sunData.position.z);
    }
    
    // 그림자 설정 
    solarLight.castShadow = true;
    
    // ✨ 수정: moon과 earth 인스턴스의 mesh 속성에 접근합니다.
    // 안전을 위해 객체가 존재하는지 확인합니다.
    if (moon.mesh) {
        moon.mesh.castShadow = true; // 달이 그림자를 던져 태양을 가림
    }
    if (earth.mesh) {
        earth.mesh.receiveShadow = true; // 지구가 달의 그림자를 받음
    }
    scene.add(solarLight);

    // --- 3. 카메라 설정 ---
    const cameraPosition = { x: 0, y: SCALE_SIZE * 10, z: SCALE_DISTANCE * 3 }; 

    return { 
        planets, 
        cameraPosition
    };
}