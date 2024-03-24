// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080

// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000

import express from "express"
import path from "path"
import http from "http"
import { Server, Socket } from "socket.io"
import * as sD from "./socketData"

const port: number = 3000
const privateHost: boolean = false

class App {
	private server: http.Server
	private port: number

	private io: Server
	private clients: { [id: string]: sD.socketData }

	private fixedTimeStep: number

	constructor( port: number ) {
		this.port = port
		const app = express()
		app.use(express.static(path.join(__dirname, "../client")))

		this.server = new http.Server(app)
		this.io = new Server(this.server)

		this.clients = {}

		this.fixedTimeStep = 1.0 / 60.0; // seconds

		this.io.on("connection", ( socket: Socket ) => {
			console.log(socket.constructor.name)
			console.log("a user connected : " + socket.id)
			this.clients[socket.id] = new sD.socketData()
			socket.emit("id", socket.id);

			socket.on("disconnect", () => {
				console.log("socket disconnected : " + socket.id);
				if (this.clients && this.clients[socket.id]) {
					console.log("deleting " + socket.id);
					delete this.clients[socket.id]
					this.io.emit("removeClient", socket.id)
				}
			})

			socket.on("create", ( message: sD.socketData ) => {
				if (this.clients[socket.id]) {
					console.log("creating " + socket.id);
					this.clients[socket.id].timeStamp = message.timeStamp
					this.clients[socket.id].keyMap = message.keyMap
					this.clients[socket.id].create(message.player.type)

					switch (this.clients[socket.id].player.type) {
						case sD.PlayerType.Box: {
							(this.clients[socket.id].player as sD.PlayerBox).init( message.player )
							break
						}
					}
				}
			})

			socket.on("update", ( message: any ) => {
				if (this.clients[socket.id]) {
					this.clients[socket.id].timeStamp = message.timeStamp
					this.clients[socket.id].keyMap = message.keyMap
					this.clients[socket.id].player.set({
						type: message.player.type,
						position: message.player.position,
						quaternion: message.player.quaternion,
					})
				}
			})
		})

		const socketLoop = () => {
			let data = {}
			Object.keys(this.clients).forEach((p) => {
				data[p] = this.clients[p].get()
			})
			this.io.emit("clients", data)
		};

		setInterval(socketLoop, this.fixedTimeStep * 1000)
	}

	public Start() {
		this.server.listen(this.port, privateHost ? "127.0.0.1" : "0.0.0.0", () => {
			console.log(`Server listening on port ${this.port}.`)
		})
	}
}

new App(port).Start()