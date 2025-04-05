defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGatherWeb.Presence

  @impl true
  def join("room:lobby", payload, socket) do
    if authorized?(payload) do
      user =
        socket.assigns.user
        |> Map.put(:x, payload["x"])
        |> Map.put(:y, payload["y"])
        |> Map.put(:dir, payload["dir"])
        |> Map.put(:state, payload["state"])

      socket = assign(socket, :user, user)

      send(self(), :after_join)

      {:ok, %{player: user, presence_state: Presence.list(socket)}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.user
    {:ok, _} = Presence.track(socket, user.id, user)
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

    # Presence.update(socket, user.id, user)

    # Broadcast to all other players in the room
    broadcast_from!(socket, "player_moved", Map.take(user, [:id, :x, :y, :dir, :state]))

    {:noreply, assign(socket, :user, user)}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
