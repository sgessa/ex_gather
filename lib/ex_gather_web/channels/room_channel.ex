defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel

  alias ExGatherWeb.Presence

  @impl true
  def join("room:lobby", payload, socket) do
    if authorized?(payload) do
      # TODO: Get user info
      user_info = %{id: socket.assigns.user_id, name: "John Doe"}
      send(self(), {:after_join, user_info})

      {:ok, %{player: user_info, presence_state: Presence.list(socket)}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info({:after_join, user_info}, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, user_info)
    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  @impl true
  def handle_in("shout", payload, socket) do
    broadcast(socket, "shout", payload)
    {:noreply, socket}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
