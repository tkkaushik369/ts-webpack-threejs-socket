import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { GUI } from 'dat.gui'
import TWEEN, { Tween } from '@tweenjs/tween.js'
import * as sD from '../../server/socketData'


export class World {
	public myId: string
	public geometryType: sD.PlayerType
	public keyMap: sD.KeyMap
	public sd: sD.socketData
	private clientCubes: { [id: string]: { data: sD.socketData } }
	public delta: number

	private renderer: THREE.WebGLRenderer
	private scene: THREE.Scene
	private camera: THREE.PerspectiveCamera
	private controls: { [id: string]: any }
	private lights: { [id: string]: any }
	private helpers: { [id: string]: any }
	public settings: any = {
		debug: true,
		helpers: false,
	}
	private gui: GUI
	private stats: Stats

	constructor() {
		// User Player
		this.myId = ""
		this.geometryType = sD.PlayerType.Box
		this.keyMap = { keydown: {}, keyup: {} }
		this.sd = new sD.socketData()
		this.clientCubes = {}
		this.delta = (1.0 / 60.0)*1000

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		document.body.appendChild(this.renderer.domElement)

		// Scene
		this.scene = new THREE.Scene()

		// Camera
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		this.camera.position.set(4, 4, 4)
		this.camera.lookAt(0, 0, 0)

		// Controls
		this.controls = {}

		this.controls.orbit = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.orbit.enablePan = false
		this.controls.orbit.enableZoom = false
		this.controls.orbit.enableDamping = true
		this.controls.orbit.dampingFactor = 0.3

		this.controls.drag = new DragControls( [], this.camera, this.renderer.domElement );
		this.controls.drag.addEventListener( 'dragstart', this.onControlDrag_DragStartEvent)
		this.controls.drag.addEventListener( 'dragend', this.onControlDrag_DragEndEvent)
		this.controls.drag.addEventListener( 'drag', this.onControlDrag_DragEvent)
		this.controls.drag.deactivate()

		// Lights
		const dirLightColor = 0xffffff
		const dirLightSize = 5
		this.lights = {}

		this.lights.dirLight = new THREE.DirectionalLight(dirLightColor, dirLightSize)
		this.lights.dirLight.position.set(-20, 20, 20)
		this.lights.dirLight.castShadow = true
		this.scene.add(this.lights.dirLight)

		this.lights.ambLight = new THREE.AmbientLight(0x404040);
		this.scene.add(this.lights.ambLight);

		// Helpers
		this.helpers = {}

		this.helpers.dirLightHelper = new THREE.DirectionalLightHelper(this.lights.dirLight, dirLightSize, dirLightColor);
		(this.helpers.dirLightHelper as THREE.DirectionalLightHelper).visible = false
		this.scene.add(this.helpers["dirLightHelper"])

		// GUI
		this.gui = new GUI()
		const settingsFolder = this.gui.addFolder('Settings')
		const debugFolder = settingsFolder.addFolder('Debug')
		debugFolder.add(this.settings, 'debug').onChange(this.debugFunc)
		debugFolder.add(this.settings, 'helpers').onChange(this.helpersFunc)

		// Stats
		this.stats = new Stats()
		document.body.appendChild(this.stats.dom)

		// Animate
		this.animate()
	}

	// Player Init
	public initSD(id: string) {
		this.myId = id
		this.sd.timeStamp = Date.now()
		this.sd.keyMap = this.keyMap
		this.sd.player.type = this.geometryType
		this.addClient(this.myId, this.sd.get())
	}

	// Players
	public addClient = (p: string, osd: any) => {
		const nsd = (p != this.myId) ? new sD.socketData() : this.sd
		nsd.create(osd.player.type)

		switch (nsd.player.type) {
			case sD.PlayerType.Box:
				{
					this.clientCubes[p] = {
						data: nsd,
					}
					const mesh = this.clientCubes[p].data.player.getThreeMesh()
					mesh.name = p
					mesh.castShadow = true
					mesh.receiveShadow = true
					this.clientCubes[p].data.player.addToScene(this.scene);
					if(p == this.myId)
						this.controls.drag.setObjects([mesh]);
					break
				}
		}
		this.debugFunc()
	}

	public removeClient = (p: string) => {
		this.clientCubes[p].data.player.removeFromScene(this.scene)
		delete this.clientCubes[p]
	}

	public removeAllClients = () => {
		Object.keys(this.clientCubes).forEach((p) => {
			this.removeClient(p)
		})
	}

	public updateClient = (clients: { [id: string]: any }, p: string, delta: number = 50) => {
		if (!this.clientCubes[p]) {
			this.addClient(p, clients[p])
		} else {
			if (this.clientCubes[p].data.player.mesh && (this.myId != p)) {
				let data: any = clients[p].player
				this.clientCubes[p].data.timeStamp = clients[p].timeStamp
				switch (data.type) {
					case sD.PlayerType.Box:
						this.clientCubes[p].data.player.updateMesh(this.clientCubes[p].data.player.mesh, data, delta)
						break
				}
				this.clientCubes[p].data.player.set(data)
			}
		}
	}

	// Events
	public onWindow_ResizeEvent = (e: any) => {
		if (this.camera) {
			this.camera.aspect = window.innerWidth / window.innerHeight
			this.camera.updateProjectionMatrix()
		}
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.render()
	}

	public onDocument_KeyEvent = (e: KeyboardEvent) => {
		this.keyMap.keyup = {}
		this.keyMap.keydown[e.code] = (e.type === "keydown")
		this.keyMap.keyup[e.code] = (e.type === "keyup")
		
		if (e.type === "keydown") {
			if (e.keyCode === 17) {
				this.controls.drag.activate()
			}
		} else if(e.type === "keyup") {
			if (e.keyCode === 17) {
				this.controls.drag.deactivate()
			}
		}
	}

	private onControlDrag_DragStartEvent = ( e: any ) => {
		e.object.material.emissive.set( 0xaaaaaa )
	}
	private onControlDrag_DragEndEvent = ( e: any ) => {
		e.object.material.emissive.set( 0x000000 )
	}
	private onControlDrag_DragEvent = ( e: any ) => {
		this.sd.player.set({
			type: this.sd.player.type,
			position: (this.sd.player.mesh as THREE.Mesh).position,
			quaternion: (this.sd.player.mesh as THREE.Mesh).quaternion,
		})
	}

	// Animated and Rendering
	private animate = () => {
		requestAnimationFrame(this.animate)
		TWEEN.update()

		this.controls.orbit.update()

		this.render()
		this.stats.update()
	}

	private render = () => {
		this.renderer.render(this.scene, this.camera)
	}

	// Settings Functions
	public debugFunc = (value: boolean = this.settings.debug) => {
	}

	public helpersFunc = (value: boolean = this.settings.helpers) => {
		Object.keys(this.helpers).forEach((p) => {
			this.helpers[p].visible = value
		})
	}
}