export class GameMap {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.platforms = [];
        this.obstacles = [];
    }
    create() {
        const floorMat = new BABYLON.StandardMaterial('floorMat', this.scene);
        try {
            const floorTex = new BABYLON.Texture('assets/textures/floor.png', this.scene, true, false);
            floorTex.uScale = 4;
            floorTex.vScale = 4;
            floorMat.diffuseTexture = floorTex;
            floorMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.12);
            floorMat.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        } catch (e) {
            floorMat.diffuseColor = new BABYLON.Color3(0.06, 0.06, 0.06);
            floorMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        }
        const rimMat = new BABYLON.StandardMaterial('rimMat', this.scene);
        rimMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        rimMat.emissiveColor = new BABYLON.Color3(0, 0.9, 0);
        rimMat.specularColor = new BABYLON.Color3(0, 0, 0);
        const obstacleMat = new BABYLON.StandardMaterial('obstacleMat', this.scene);
        obstacleMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        obstacleMat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
        obstacleMat.alpha = 0.8;
        // Main Platform
        const mainDiameter = 64;
        const mainPlatform = BABYLON.MeshBuilder.CreateCylinder('mainPlatform', {
            diameter: mainDiameter,
            height: .6,
            tessellation: 6
        }, this.scene);
        mainPlatform.position.y = 0;
        mainPlatform.material = floorMat;
        mainPlatform.rotation.y = -Math.PI / 1;
        this._addPhysics(mainPlatform, 0, 0.9);
        this.platforms.push(mainPlatform);
        this._createRim(mainPlatform, mainDiameter, 6, rimMat);
        const satelliteDist = 75;
        const satelliteRadius = 20;
        const outerDist = 58;
        const outerRadius = 10;
        const innerSats = [];
        for (let i = 0; i < 6; i++) {
            if (i % 1 !== 0) continue;
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * satelliteDist;
            const z = Math.sin(angle) * satelliteDist;
            const sat = BABYLON.MeshBuilder.CreateCylinder(`sat_${i}`, {
                diameter: satelliteRadius * 2,
                height: 0.6,
                tessellation: 16
            }, this.scene);
            sat.position = new BABYLON.Vector3(x, 0, z);
            sat.material = floorMat;
            this._addPhysics(sat, 0, 0.9);
            this.platforms.push(sat);
            innerSats.push(sat);
            this._createRim(sat, satelliteRadius * 2, 16, rimMat);
        }
        this._createObstacles(mainDiameter);
        this._createObstacles2(mainDiameter);
        this._createObstacles3(mainDiameter);
        return mainPlatform;
    }
    _addSkipIndices(arr, angle, tessellation) {
        let k = Math.round((angle / (Math.PI * 2)) * tessellation);
        k = (k % tessellation + tessellation) % tessellation;
        arr.push(k);
        arr.push((k - 1 + tessellation) % tessellation);
    }
    _addPhysics(mesh, mass = 0, restitution = 0.9) {
        if (!this.game.physicsEnabled) return;
        try {
            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass, restitution, friction: 0.5 }, this.scene);
        } catch (e) {
            try {
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass, restitution, friction: 0.5 }, this.scene);
            } catch (e2) { }
        }
    }

    _addBoxPhysics(mesh, mass = 0, restitution = 0.9) {
        if (!this.game.physicsEnabled) return;
        try {
            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass, restitution, friction: 0.5 }, this.scene);
        } catch (e) {
            try {
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass, restitution, friction: 0.5 }, this.scene);
            } catch (e2) { }
        }
    }
    _createRim(parent, diameter, tessellation, material, skipIndices = [], offsetAngle = 0) {
        const rimHeight = 0.25;
        const thickness = 0.25;
        const radius = diameter / 2;
        const theta = (Math.PI * 2) / tessellation;
        const sideLength = 2 * radius * Math.sin(Math.PI / tessellation);
        const midRadius = radius * Math.cos(Math.PI / tessellation);
        for (let i = 0; i < tessellation; i++) {
            if (skipIndices.includes(i)) continue;
            const midAngle = (i * theta) + theta / 2 + offsetAngle;
            const x = parent.position.x + Math.cos(midAngle) * midRadius;
            const z = parent.position.z + Math.sin(midAngle) * midRadius;
            const box = BABYLON.MeshBuilder.CreateBox(`rim_${parent.name}_${i}`, {
                width: sideLength,
                height: rimHeight,
                depth: thickness
            }, this.scene);
            box.position = new BABYLON.Vector3(x, parent.position.y + 0.3 + rimHeight / 2, z);
            box.lookAt(parent.position);
            box.material = material;
            this._addPhysics(box, 0, 0.1);
        }
    }
    _createBridge(start, end, width, mat, rimMat, startOffset = 0, endOffset = 0) {
        const fullDist = BABYLON.Vector3.Distance(start, end);
        const len = Math.max(0.1, fullDist - startOffset - endOffset);
        const dir = end.subtract(start).normalize();
        const mid = start.add(dir.scale(startOffset + len / 2));
        const bridge = BABYLON.MeshBuilder.CreateBox('bridge', {
            width: width + 3,
            height: 1.2,
            depth: len / 2
        }, this.scene);
        bridge.position = mid;
        bridge.position.y = 0;
        bridge.lookAt(end);
        bridge.material = mat;
        this._addPhysics(bridge, 0, 0.9);
        this.platforms.push(bridge);
        const rimH = 0.4;
        const rimW = .2;
        const leftRim = BABYLON.MeshBuilder.CreateBox('bridgeRimL', {
            width: rimW / 2, height: rimH, depth: len / 2
        }, this.scene);
        const rightRim = BABYLON.MeshBuilder.CreateBox('bridgeRimR', {
            width: rimW / 2, height: rimH, depth: len / 2
        }, this.scene);

        try {
            const xDir = bridge.getDirection(BABYLON.Axis.X);
            const leftPos = bridge.position.add(xDir.scale(-width + rimW - 0.3));
            const rightPos = bridge.position.add(xDir.scale(width - rimW));

            leftRim.position = new BABYLON.Vector3(leftPos.x, 0.6 + rimH / 2, leftPos.z);
            rightRim.position = new BABYLON.Vector3(rightPos.x, 0.6 + rimH / 2, rightPos.z);

            if (bridge.rotationQuaternion) {
                leftRim.rotationQuaternion = bridge.rotationQuaternion.clone();
                rightRim.rotationQuaternion = bridge.rotationQuaternion.clone();
            } else {
                leftRim.rotation = bridge.rotation.clone();
                rightRim.rotation = bridge.rotation.clone();
            }
        } catch (e) {
            leftRim.parent = bridge;
            leftRim.position.x = -width + rimW - .3;
            leftRim.position.y = 0.6 + rimH / 2;
            rightRim.parent = bridge;
            rightRim.position.x = width - rimW;
            rightRim.position.y = 0.6 + rimH / 2;
        }

        leftRim.material = rimMat;
        rightRim.material = rimMat;

        this._addBoxPhysics(leftRim, 0, 1);
        this._addBoxPhysics(rightRim, 0, 1);
    }
    _createObstacles(arenaDiameter) {
        //pillars
        const count = 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.PI / 3;
            const r = arenaDiameter * .15;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar_${i}`, {
                diameter: 3, height: 6
            }, this.scene);
            pillar.position.set(x, 2, z);
            const pMat = new BABYLON.StandardMaterial('pillarMat', this.scene);
            pMat.emissiveColor = new BABYLON.Color3(1, 0, 1);
            pMat.alpha = 0.6;
            pillar.material = pMat;
            this._addPhysics(pillar, 0, 0.5);
            this.obstacles.push(pillar);
        }
    }
    _createObstacles2(arenaDiameter) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.PI / 1.5;
            const r = arenaDiameter * 1.15;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar_${i}`, {
                diameter: 3, height: 6
            }, this.scene);
            pillar.position.set(x, 2, z);
            const pMat = new BABYLON.StandardMaterial('pillarMat', this.scene);
            pMat.emissiveColor = new BABYLON.Color3(1, 0, 1);
            pMat.alpha = 0.6;
            pillar.material = pMat;
            this._addPhysics(pillar, 0, 0.5);
            this.obstacles.push(pillar);
        }
    }
    _createObstacles3(arenaDiameter) {
        const count = 6;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.PI / 1.2;
            const r = arenaDiameter * 0.35;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar_${i}`, {
                diameter: 3, height: 6
            }, this.scene);
            pillar.position.set(x, 2, z);
            const pMat = new BABYLON.StandardMaterial('pillarMat', this.scene);
            pMat.emissiveColor = new BABYLON.Color3(1, 0, 1);
            pMat.alpha = 0.6;
            pillar.material = pMat;
            this._addPhysics(pillar, 0, 0.5);
            this.obstacles.push(pillar);
        }
    }
}