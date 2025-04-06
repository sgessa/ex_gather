defmodule ExGatherWeb.RoomChannel do
  use ExGatherWeb, :channel
  alias ExGatherWeb.RoomJSON

  alias ExGather.Room.RTC

  @impl true
  def join("room:" <> _room = room_name, _payload, socket) do
    player = socket.assigns.player

    {:ok, rtc} = RTC.start()

    socket = socket
      |> assign(:player, player)
      |> assign(:room_server, :"#{room_name}")
      |> assign(:rtc, rtc)

    send(self(), :after_join)

    {:ok, %{player: player}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    %{player: player, rtc: rtc, room_server: room_server} = socket.assigns
    {:ok, player, players} = GenServer.call(room_server, {:join, player, rtc})

    push(socket, "room_state", RoomJSON.room_state(players, player))
    broadcast_from!(socket, "player_join", RoomJSON.player(player))

    {:noreply, socket}
  end

  def handle_info({:ex_webrtc, _from, packet}, socket) do
    handle_rtc(packet, socket)
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

  def handle_in("offer", data, socket) do
    rtc = socket.assigns.rtc

    with {:ok, answer} <- RTC.handle_offer(data, rtc.pid) do
      push(socket, "answer", answer)
    end

    {:noreply, socket}
  end

  def handle_in("ice", data, socket) do
    rtc = socket.assigns.rtc

    RTC.handle_ice(data, rtc.pid)
    {:noreply, socket}
  end

  #
  # Handle WebRTC messages
  #

  defp handle_rtc({:ice_candidate, candidate}, socket) do
    candidate = ExWebRTC.ICECandidate.to_json(candidate)
    push(socket, "ice", candidate)
  end

  defp handle_rtc({:rtp, _id, nil, packet}, socket) do
    rtc = socket.assigns.rtc
    room_server = socket.assigns.room_server

    GenServer.cast(room_server, {:rtc, rtc, packet})
  end

  defp handle_rtc(_msg, _socket), do: :ok

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
