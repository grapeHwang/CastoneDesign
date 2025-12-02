// public/js/Planet.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PLANET_TEXTURES } from './textureData.js';

const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);

export class Planet {
  constructor(scene, world, loader, data, scenarioType) {
    this.mesh = null; //
    this.scene = scene;
    this.world = world;
    this.data = data;
    this.isDead = false;

    // 속성 설정
    this.radius = num(data.size, 5);
    this.mass = num(data.mass, 1);
    this.isStar = data.textureKey === 'Sun';

    // ★ 시나리오별 특수 설정
    // 'planet_birth'일 경우에만 성장 플래그 켜기
    this.scenarioType = scenarioType;
    this.isGrowing = (scenarioType === 'planet_birth'); 
    this.age = 0;
    this.maxAge = 120; // 약 2초 동안 성장 (60fps 기준)

    // 1. 뷰 (Mesh)
    
    // ✨ 수정: PLANET_TEXTURES에서 경로를 가져오고, 경로가 없으면 기본값 설정
    const texturePath = PLANET_TEXTURES[data.textureKey]?.map || 'assets/textures/default.jpg';
    
    // 텍스처 로드 시 경로가 잘못되면 404 발생
    const texture = loader.load(texturePath); 
    
    const material = this.isStar 
      ? new THREE.MeshBasicMaterial({ map: texture }) 
      : new THREE.MeshStandardMaterial({ map: texture });

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 32, 32), material);
    
    //
    // 성장 모드면 0에서 시작, 아니면 원래 크기
    if (this.isGrowing) {
        this.mesh.scale.set(0.01, 0.01, 0.01);
    } else {
        this.mesh.scale.set(1, 1, 1);
    }
    
    scene.add(this.mesh);

    // 2. 물리 (Body)
    const pos = data.position || { x: 0, y: 0, z: 0 };
    const vel = data.velocity || { x: 0, y: 0, z: 0 };

    this.body = new CANNON.Body({
      mass: this.mass,
      shape: new CANNON.Sphere(this.radius),
      position: new CANNON.Vec3(num(pos.x), num(pos.y), num(pos.z)),
      velocity: new CANNON.Vec3(num(vel.x), num(vel.y), num(vel.z)),
      linearDamping: 0,
      angularDamping: 0
    });

    this.mesh.position.copy(this.body.position);

    if (scenarioType === 'lunar_eclipse' || scenarioType === 'solar_eclipse') {
        
        // 일식: 달이 그림자를 던지고 지구가 그림자를 받음 (그림자가 보이면 월식이 아님!)
        if (data.textureKey === 'Moon') {
            this.mesh.castShadow = true; 
        }
        if (data.textureKey === 'Earth') {
            this.mesh.receiveShadow = true;
        }
        if (data.textureKey === 'Earth') {
            this.mesh.castShadow = true;
        }
      }

    // 자전축 기울기 (지구 기준 23.5도)
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 23.5);
    
    world.addBody(this.body);

    // 충돌 감지
    if(scenarioType == 'collision'){this.body.addEventListener("collide", (e) => {
        if (this.isStar) return; // 태양은 무적
        console.log(`💥 ${data.name || 'Planet'} 충돌!`);
        this.isDead = true; 
        e.contact.bi.isMarkedForRemoval = true;
    })};
  }

  update(deltaTime) {
    if (this.body.isMarkedForRemoval) this.isDead = true;

    // 1. 성장 애니메이션 (Birth)
    if (this.isGrowing) {
        this.age += 1;
        const progress = Math.min(this.age / this.maxAge, 1.0);
        // Ease-out 효과 (처음엔 빠르고 나중엔 천천히)
        const scale = 1.0 * (1 - Math.pow(1 - progress, 3)); 
        
        this.mesh.scale.set(scale, scale, scale);
        
        if (progress >= 1.0) this.isGrowing = false;
    }

    // 2. 위치/회전 동기화
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);

    // 3. 자전 (스스로 회전)
    this.mesh.rotation.y += 0.005; 


    
  }

  dispose() {
    this.world.removeBody(this.body);
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}