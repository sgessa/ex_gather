defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  @impl true
  def join("room:" <> _room = room_name, _payload, socket) do
    player = socket.assigns.player
    socket = socket
      |> assign(:player, player)
      |> assign(:room_server, :"#{room_name}")

    send(self(), :after_join)

    {:ok, %{player: player}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    {:ok, player, players} = GenServer.call(room_server, {:join, player})

    push(socket, "room_state", %{players: players, player: player})
    broadcast_from!(socket, "player_join", player)

    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("player_move", movement, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    GenServer.cast(room_server, {:update_player, player.id, movement})

    # Broadcast to all other players in the room
    broadcast_from!(socket, "player_moved", Map.put(movement, "id", player.id))

    {:noreply, assign(socket, :player, player)}
  end

  @impl true
  def terminate(_reason, socket) do
    player = socket.assigns.player
    room_server = socket.assigns.room_server
    :ok = GenServer.call(room_server, {:leave, player})

    # Automatically called on disconnect
    broadcast_from!(socket, "player_left", %{id: socket.assigns.player.id})
    :ok
  end
end
