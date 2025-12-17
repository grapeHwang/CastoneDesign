// public/scenarios/SceneSolarEclipse.js

import { Planet } from '../planet.js';
import * as THREE from 'three'; // ✨ THREE 객체를 사용하려면 import 필요
import * as CANNON from 'cannon-es'

/**
 * 개기일식 장면을 초기화합니다. (Sun -> Moon -> Earth 정렬)
 * @returns {Object} { planets: Planet[], cameraPosition: {x, y, z} }
 */
export function initSolarEclipseScene(scene, world, loader, aiData, ambientLight) {
    console.log("🌑 [SceneSolarEclipse] 함수 실행되었습니다.");
    const planets = [];
    const SCENARIO_TYPE = 'solar_eclipse';

    // --- 설정 상수 ---
    const SCALE_DISTANCE = 10; 
    const SCALE_SIZE = 1;      

    // --- 기본 천체 데이터 ---
    const sunData = { name: 'Sun', textureKey: 'Sun', size: SCALE_SIZE * 20};//, mass: 10000 
    const earthData = { name: 'Earth', textureKey: 'Earth', size: SCALE_SIZE * 1.5};//, mass: 100 
    const moonData = { name: 'Moon', textureKey: 'Moon', size: SCALE_SIZE * 1};//, mass: 5 

    // --- 1. 위치/속도 설정 (일식 정렬) ---
    
    // A. 태양: 멀리 떨어진 광원 (Z축 음수 방향)
    sunData.position = { x: 0, y: 0, z: -SCALE_DISTANCE * 40 }; 
    sunData.velocity = { x: 0, y: 0, z: 0 };

    // B. 지구: 관찰 기준점 (중앙)
    earthData.position = { x: 0, y: 0, z: 0 };
    earthData.velocity = { x: 0, y: 0, z: 0 }; 

    // C. 달: 지구와 태양 사이에 위치하여 태양을 가림
    moonData.position = { x: 0, y: 0, z: -SCALE_SIZE * 5 }; 
    moonData.velocity = { x: 0, y: 0, z: 0 }; // 서서히 이동하며 일식 진행

    // --- 2. 행성 생성 ---

    const sun = new Planet(scene, world, loader, sunData, SCENARIO_TYPE);
    const earth = new Planet(scene, world, loader, earthData, SCENARIO_TYPE);
    const moon = new Planet(scene, world, loader, moonData, SCENARIO_TYPE);

    planets.push(sun, earth, moon); // 인스턴스를 배열에 추가

    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
        sunLight.distance = 0;
    
        if(sun.body){
            sunLight.position.copy(sun.body.position);
        }
        else{
            sunLight.position.set(0, 0, sunData.position.z);
        }
        sunLight.castShadow = true;
        sunLight.target.position.set(0, 0, 0);
        scene.add(sunLight)
        scene.add(sunLight.target);
    
    // ✨ 수정: moon과 earth 인스턴스의 mesh 속성에 접근합니다.
    // 안전을 위해 객체가 존재하는지 확인합니다.
    if (moon.mesh) {
        moon.mesh.castShadow = true; // 달이 그림자를 던져 태양을 가림
    }
    if (earth.mesh) {
        earth.mesh.receiveShadow = true; // 지구가 달의 그림자를 받음
    }
    scene.add(sunLight);

    // --- 3. 카메라 설정 ---
    const cameraPosition = { x: 0, y: SCALE_SIZE * 10, z: SCALE_DISTANCE * 5 }; 
    
    const setupControls = (camera, controls, ambientLight) => { 
    
    const handleKeydown = (event) => {
        if (event.key === 'Enter') {
            if (earth.mesh && moon.body) {
                console.log("📸 관측 시점 강제 동기화 (1회 입력으로 즉시 정렬)");

                // 1. 컨트롤러 잠시 끄기 (마우스 입력 간섭 차단)
                controls.enabled = false; 

                // 2. 카메라의 '위(Up)' 방향을 초기화 (각도가 꼬이는 것 방지)
                camera.up.set(0, 1, 0);

                // 3. 카메라 위치를 지구 시점으로 즉시 이동
                camera.position.set(0, 0,  -SCALE_DISTANCE); 

                // 4. OrbitControls의 중심축(Target)을 태양으로 강제 고정
                controls.target.set(0, 0, sunData.position.z); 

                // 5. 매우 중요: 카메라가 타겟을 즉시 바라보게 강제 실행
                camera.lookAt(0, 0, sunData.position.z);

                // 6. 컨트롤러 업데이트 및 활성화
                controls.update();
                controls.enabled = true;

                // 7. 이후 애니메이션 로직 (동일)
                moon.body.position.set(10, 0, -2 * SCALE_DISTANCE);
                moon.body.velocity.set(-1.5, 0, 0); 
                
                // 일식 연출 도중 카메라 회전을 막고 싶다면 아래 주석 해제
                // controls.enableRotate = false; 

                // (나머지 밝기 애니메이션 및 setTimeout 코드...)
                animateBrightness(0.05, 10000);
                setTimeout(() => {
                    animateBrightness(1.0, 4000);
                }, 18000);
            }
        }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
};

    return { 
        planets, 
        cameraPosition,
        setupControls : (camera, controls) => setupControls(camera, controls, ambientLight)
    };
}