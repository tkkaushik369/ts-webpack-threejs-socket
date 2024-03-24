import * as THREE from "three"
import TWEEN, { Tween } from "@tweenjs/tween.js"

export enum PlayerType {
	None,
	Box,
}

export type KeyMap = {
	keydown: { [id: string]: boolean }
	keyup: { [id: string]: boolean }
}

export class Player {
	public type: PlayerType
	public mesh: THREE.Mesh
	public out: { type: PlayerType }

	constructor() {
		this.type = PlayerType.None
		this.mesh = new THREE.Mesh()

		this.out = {
			type: this.type,
		}
	}

	public init( data: any ) {

	}

	public updateMesh( mesh: THREE.Mesh, data: any, delta: number = 50 ) {

	}

	public updateKeys( keyMap: KeyMap = { keydown: {}, keyup: {} } ) {

	}

	public get(): { type: PlayerType } {
		this.out = {
			type: this.type,
		}
		return this.out
	}

	public set( data: any ) {
		this.type = data.type
	}

	public getThreeMesh( creation: boolean = true ): THREE.Mesh {
		this.mesh = new THREE.Mesh()
		return this.mesh
	}

	public addToScene( scene: THREE.Scene ) {
		scene.add( this.mesh )
	}

	public removeFromScene( scene: THREE.Scene ) {
		scene.remove( this.mesh )
	}
}

export class PlayerBox implements Player {
	public type: PlayerType
	public mesh: THREE.Mesh
	private position: THREE.Vector3
	private quaternion: THREE.Quaternion
	public out: {
		type: PlayerType
		position: THREE.Vector3
		quaternion: THREE.Quaternion
	}

	constructor() {
		this.type = PlayerType.Box
		this.mesh = new THREE.Mesh()
		this.position = new THREE.Vector3()
		this.quaternion = new THREE.Quaternion()

		this.out = {
			type: this.type,
			position: this.position,
			quaternion: this.quaternion,
		}
	}

	public init( data: any ) {

	}

	public updateMesh( mesh: THREE.Mesh, data: any, delta: number = 50 ) {
		if ( data.position ) {
			new TWEEN.Tween( this.mesh.position ).to({
						x: data.position.x,
						y: data.position.y,
						z: data.position.z,
					}, delta ).start()
		}
		if ( data.quaternion ) {
			new TWEEN.Tween( this.mesh.quaternion ).to({
						x: data.quaternion.x,
						y: data.quaternion.y,
						z: data.quaternion.z,
						w: data.quaternion.w,
					}, delta ).start();
		}
	}

	public updateKeys( keyMap: KeyMap = { keydown: {}, keyup: {} } ) {
		Object.keys(keyMap.keydown).forEach((keys) => {
			// Move Body
		})
	}

	public get(): { type: PlayerType, position: THREE.Vector3, quaternion: THREE.Quaternion } {
		this.out = {
			type: this.type,
			position: this.position,
			quaternion: this.quaternion,
		};
		return this.out;
	}

	public set( data: any ) {
		this.type = data.type
		this.position = data.position
		this.quaternion = data.quaternion
	}

	public getThreeMesh(creation: boolean = true): THREE.Mesh {
		const geometry = new THREE.BoxGeometry()
		const material = new THREE.MeshStandardMaterial({ color: 0xaa2266 })
		this.mesh = new THREE.Mesh(geometry, material)
		return this.mesh
	}

	public addToScene(scene: THREE.Scene) {
		scene.add(this.mesh)
	}

	public removeFromScene(scene: THREE.Scene) {
		scene.remove(this.mesh)
	}
}

export class socketData {
	public timeStamp: number
	public keyMap: KeyMap = { keydown: {}, keyup: {} }
	public player: Player

	constructor() {
		this.timeStamp = 1.0 / 60.0;
		this.player = new Player();
	}

	public create(type: PlayerType) {
		switch (type as PlayerType) {
			case PlayerType.Box:
				this.player = new PlayerBox()
				break;
		}
	}

	public get() {
		return {
			timeStamp: this.timeStamp,
			keyMap: this.keyMap,
			player: this.player.get(),
		}
	}
}
