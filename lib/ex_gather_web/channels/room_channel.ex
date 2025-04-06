defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  @impl true
  def join("room:" <> _room = room_name, payload, socket) do
    if authorized?(payload) do
      user =
        socket.assigns.user
        |> Map.put(:x, payload["x"])
        |> Map.put(:y, payload["y"])
        |> Map.put(:dir, payload["dir"])
        |> Map.put(:state, payload["state"])

      room_server = String.to_existing_atom(room_name)
      socket = socket |> assign(:user, user) |> assign(:room_server, room_server)

      send(self(), :after_join)

      {:ok, %{player: user}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.user
    room_server = socket.assigns.room_server
    {:ok, players} = GenServer.call(room_server, {:join, user})

    push(socket, "room_state", %{players: players})
    broadcast_from!(socket, "player_join", user)

    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("player_move", movement, socket) do
    user =
      socket.assigns.user
      |> Map.put(:x, movement["x"])
      |> Map.put(:y, movement["y"])
      |> Map.put(:dir, movement["dir"])
      |> Map.put(:state, movement["state"])

    room_server = socket.assigns.room_server
    GenServer.cast(room_server, {:update_player, user})

    # Broadcast to all other players in the room
    broadcast_from!(socket, "player_moved", Map.take(user, [:id, :x, :y, :dir, :state]))

    {:noreply, assign(socket, :user, user)}
  end

  @impl true
  def terminate(_reason, socket) do
    user = socket.assigns.user
    room_server = socket.assigns.room_server
    :ok = GenServer.call(room_server, {:leave, user})

    # Automatically called on disconnect
    broadcast_from!(socket, "player_left", %{id: socket.assigns.user.id})
    :ok
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
