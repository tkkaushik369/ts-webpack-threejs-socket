import TWEEN from "@tweenjs/tween.js"
import { io } from "socket.io-client"
import { World } from "./world/World"
import * as sD from "../server/socketData"

const reconnectDiv = document.getElementById("reconnect") as HTMLDivElement
const world = new World()
const socket = io()

socket.on("connect", function () {
	console.log("connect")
	reconnectDiv.style.display = "none"
})

socket.on("disconnect", function (message: any) {
	console.log("disconnect " + message)
	world.removeAllClients();
	reconnectDiv.style.display = "block"
})

socket.on("id", (id: string) => {
	world.initSD(id)
	socket.emit("create", world.sd.get());
	setInterval(() => {
		world.sd.timeStamp = Date.now()
		world.sd.keyMap = world.keyMap;
		socket.emit("update", world.sd.get())
	}, world.delta);
})

socket.on("clients", (clients: { [id: string]: any }) => {
	let pingStatsHtml = "Socket Ping Stats<br/><br/>"
	TWEEN.removeAll();
	Object.keys(clients).forEach((p) => {
		world.delta = Date.now() - clients[p].timeStamp
		pingStatsHtml += p + "\t" + world.delta + "ms<br/>"
		world.updateClient(clients, p, world.delta)
	});
	(document.getElementById("pingStats") as HTMLDivElement).innerHTML = pingStatsHtml
})

socket.on("removeClient", (id: string) => {
	world.removeClient(id)
})

window.addEventListener("resize", world.onWindow_ResizeEvent, false);
document.addEventListener("keydown", world.onDocument_KeyEvent, false);
document.addEventListener("keyup", world.onDocument_KeyEvent, false);
