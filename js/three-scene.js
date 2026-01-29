// =====================================================
// THREE.JS 3D BACKGROUND SCENE
// =====================================================

class ThreeScene {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.geometries = [];
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Create elements
        this.createParticles();
        this.createFloatingGeometries();
        
        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Start animation
        this.animate();
    }
    
    createParticles() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color1 = new THREE.Color(0x6366f1);
        const color2 = new THREE.Color(0x8b5cf6);
        const color3 = new THREE.Color(0x06b6d4);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 15;
            positions[i + 1] = (Math.random() - 0.5) * 15;
            positions[i + 2] = (Math.random() - 0.5) * 15;
            
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.33) color = color1;
            else if (colorChoice < 0.66) color = color2;
            else color = color3;
            
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createFloatingGeometries() {
        const geometryConfigs = [
            { type: 'torus', args: [1, 0.3, 16, 100], position: [4, 2, -3], color: 0x6366f1 },
            { type: 'icosahedron', args: [0.8, 0], position: [-4, -1, -2], color: 0x8b5cf6 },
            { type: 'octahedron', args: [0.6, 0], position: [3, -2, -4], color: 0x06b6d4 },
            { type: 'dodecahedron', args: [0.5, 0], position: [-3, 2, -3], color: 0x6366f1 },
            { type: 'torus', args: [0.5, 0.2, 16, 50], position: [0, 3, -5], color: 0x8b5cf6 }
        ];
        
        geometryConfigs.forEach(config => {
            let geometry;
            switch (config.type) {
                case 'torus':
                    geometry = new THREE.TorusGeometry(...config.args);
                    break;
                case 'icosahedron':
                    geometry = new THREE.IcosahedronGeometry(...config.args);
                    break;
                case 'octahedron':
                    geometry = new THREE.OctahedronGeometry(...config.args);
                    break;
                case 'dodecahedron':
                    geometry = new THREE.DodecahedronGeometry(...config.args);
                    break;
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...config.position);
            mesh.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                },
                floatSpeed: Math.random() * 0.5 + 0.5,
                floatOffset: Math.random() * Math.PI * 2
            };
            
            this.geometries.push(mesh);
            this.scene.add(mesh);
        });
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(event) {
        this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Smooth mouse following
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        
        // Animate particles
        if (this.particles) {
            this.particles.rotation.x += 0.0003;
            this.particles.rotation.y += 0.0005;
            this.particles.rotation.x += this.mouse.y * 0.0003;
            this.particles.rotation.y += this.mouse.x * 0.0003;
        }
        
        // Animate geometries
        this.geometries.forEach(mesh => {
            mesh.rotation.x += mesh.userData.rotationSpeed.x;
            mesh.rotation.y += mesh.userData.rotationSpeed.y;
                        mesh.rotation.z += mesh.userData.rotationSpeed.z;
            
            // Floating animation
            mesh.position.y += Math.sin(time * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.002;
            
            // Mouse interaction
            mesh.rotation.x += this.mouse.y * 0.001;
            mesh.rotation.y += this.mouse.x * 0.001;
        });
        
        // Camera subtle movement
        this.camera.position.x += (this.mouse.x * 0.5 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 0.5 - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Skills 3D Visualization
class SkillsVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.skillBars = [];
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Observe visibility
        this.setupIntersectionObserver();
        
        this.animate();
    }
    
    createSkillBars(skills) {
        // Clear existing bars
        this.skillBars.forEach(bar => this.scene.remove(bar));
        this.skillBars = [];
        
        const barWidth = 0.5;
        const spacing = 1.2;
        const startX = -((skills.length - 1) * spacing) / 2;
        
        skills.forEach((skill, index) => {
            const height = (skill.level / 100) * 3;
            
            // Create bar geometry
            const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
            
            // Create gradient material
            const color = new THREE.Color();
            color.setHSL(0.7 - (skill.level / 100) * 0.3, 0.8, 0.5);
            
            const material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                shininess: 100
            });
            
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(startX + index * spacing, height / 2 - 1.5, 0);
            bar.userData = {
                targetHeight: height,
                currentHeight: 0,
                skill: skill
            };
            
            this.skillBars.push(bar);
            this.scene.add(bar);
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
            });
        }, { threshold: 0.3 });
        
        const skillsSection = document.getElementById('skills');
        if (skillsSection) {
            observer.observe(skillsSection);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animate skill bars
        this.skillBars.forEach((bar, index) => {
            if (this.isVisible) {
                // Grow animation
                if (bar.userData.currentHeight < bar.userData.targetHeight) {
                    bar.userData.currentHeight += 0.05;
                    bar.scale.y = bar.userData.currentHeight / bar.userData.targetHeight;
                }
            }
            
            // Floating animation
            bar.position.y = (bar.userData.targetHeight / 2 - 1.5) + Math.sin(time * 2 + index * 0.5) * 0.1;
            bar.rotation.y = Math.sin(time + index * 0.3) * 0.1;
        });
        
        // Rotate camera slightly
        this.camera.position.x = Math.sin(time * 0.3) * 2;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize Three.js scenes when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Main background scene
    window.threeScene = new ThreeScene();
    
    // Skills visualization
    window.skillsViz = new SkillsVisualization('skills-canvas');
});