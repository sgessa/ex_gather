// Establish Phoenix Socket and LiveView configuration.
import {Socket, Presence} from "phoenix"

// this.socket = new Socket("/socket", { params: { userToken: window.userToken } });
let socket = new Socket("/socket", { params: payload });
socket.connect();

channel = socket.channel(channelName, {});

let presence = new Presence(this.channel)
presence.onSync(() => renderOnlineUsers(presence))

presence.list((id, {metas: [first, ...rest]}) => {
  let count = rest.length + 1
  console.log(`User ${id} is online, ${count} total users`)
})

// Send a message to the channel
// channel.push("new_msg", { body: "Hello from Phoenix!" })
//   .receive("ok", (resp) => { console.log("Message sent successfully", resp) })
//   .receive("error", (resp) => { console.log("Message failed", resp) });
//

