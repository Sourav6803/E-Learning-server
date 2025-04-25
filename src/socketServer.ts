import {Server as SocketIOServer} from "socket.io";
import http from "http"

export const initSocketServer = (server: http.Server) =>{
    const io = new SocketIOServer(server)

    io.on("connection", (socket)=>{
        console.log("A user connected")

        // Listen for notification event from the frontend
        socket.on("notification", (data:any)=>{

            io.emit("newNotification", data)
            console.log("new notification", data)
        })
        socket.on("disconnect", ()=>{
            console.log("A user disconnected.")
        })
    })
}