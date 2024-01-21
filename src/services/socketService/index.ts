import { Socket, io } from "socket.io-client";
import { DefaultEventsMap } from "socket.io-client/build/typed-events"

class SocketService {

  public socket: Socket | null = null;
  
  public connect(url: string): Promise<Socket<DefaultEventsMap, DefaultEventsMap>> {
    return new Promise((res, rej) => {
      this.socket = io(url);

      if (!this.socket) {
        return rej();
      }

      this.socket.on("connect", () => {
        res(this.socket as Socket);
      });

      this.socket.on("connect_error", (err) => {
        console.log("Conn error: ", err);
        rej(err)
      })
    })
  }
}

export default new SocketService();