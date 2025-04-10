defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGatherWeb.RoomJSON

  @impl true
  def join("room:" <> _room = room_name, _payload, socket) do
    player = socket.assigns.player

    socket =
      socket
      |> assign(:player, player)
      |> assign(:room_server, :"#{room_name}")

    send(self(), :after_join)

    {:ok, %{player: player}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    %{player: player, room_server: room_server} = socket.assigns
    {:ok, player, players} = GenServer.call(room_server, {:join, player})

    push(socket, "room_state", RoomJSON.room_state(players, player))
    broadcast_from!(socket, "player_join", RoomJSON.player(player))

    {:noreply, socket}
  end

  def handle_info({:push, event, data}, socket) do
    push(socket, event, data)
    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("player_move", movement, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server

    # Broadcast to all other players in the room
    broadcast_from!(socket, "player_moved", Map.put(movement, "player_id", player.id))

    GenServer.cast(room_server, {:update_player, player.id, movement})

    {:noreply, assign(socket, :player, player)}
  end

  def handle_in("webrtc_audio", params, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:update_player, sender.id, params})
    broadcast_from!(socket, "webrtc_audio", Map.put(params, "player_id", sender.id))

    {:noreply, socket}
  end

  def handle_in("webrtc_offer", %{"offer" => offer, "player_id" => rctp_id}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, rctp_id, "webrtc_offer", %{"player_id" => sender.id, "offer" => offer}}
    )

    {:noreply, socket}
  end

  def handle_in("webrtc_answer", %{"player_id" => recpt_id, "answer" => answer}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, recpt_id, "webrtc_answer", %{"player_id" => sender.id, "answer" => answer}}
    )

    {:noreply, socket}
  end

  def handle_in("webrtc_candidate", %{"player_id" => recpt_id, "candidate" => candidate}, socket) do
    sender = socket.assigns.player
    room_server = socket.assigns.room_server

    GenServer.cast(
      room_server,
      {:push_to, recpt_id, "webrtc_candidate",
       %{"player_id" => sender.id, "candidate" => candidate}}
    )

    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    :ok = GenServer.call(room_server, {:leave, player.id})

    # Automatically called on disconnect
    broadcast_from!(socket, "player_left", %{id: player.id})

    :ok
  end
end
