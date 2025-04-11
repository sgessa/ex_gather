defmodule ExGather.Room.Server do
  use GenServer

  alias ExGather.Room.RTC

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %{players: %{}}}
  end

  def handle_call({:join, player}, {from_pid, _ref} = _from, state) do
    player = init_player_state(player, from_pid)
    players = Map.put(state.players, player["id"], player)
    {:reply, {:ok, player, state.players}, %{state | players: players}}
  end

  def handle_call({:leave, player_id}, _from, state) do
    players = Map.delete(state.players, player_id)
    {:reply, :ok, %{state | players: players}}
  end

  def handle_cast({:update_player, id, attrs}, state) do
    player = state.players |> Map.get(id) |> Map.merge(attrs)
    players = Map.put(state.players, id, player)
    {:noreply, %{state | players: players}}
  end

  def handle_cast({:push_to, id, event, data}, state) do
    with %{"socket_pid" => socket_pid} <- state.players[id] do
      send(socket_pid, {:push, event, data})
    end

    {:noreply, state}
  end

  def handle_cast({:exrtc_offer, id, rtc_pid, offer}, state) do
    {:ok, tracks} = RTC.create_stream_tracks()

    player =
      state.players[id]
      |> Map.put("rtc_pid", rtc_pid)
      |> Map.put("rtc_tracks", tracks)

    state.players
    |> Enum.reject(fn {id, _player} -> id == player["id"] end)
    |> Enum.each(fn {_id, player} ->
      RTC.attach_tracks_to_peer(rtc_pid, player["rtc_tracks"])
      # RTC.attach_tracks_to_peer(player["rtc_pid"], tracks)
    end)

    {:ok, answer} = RTC.handle_offer(rtc_pid, offer)
    send(player["socket_pid"], {:push, "exrtc_answer", %{"answer" => answer}})

    players = Map.put(state.players, id, player)
    {:noreply, %{state | players: players}}
  end

  def handle_cast({:exrtc_ice, id, ice}, state) do
    player = state.players[id]
    RTC.handle_ice(player["rtc_pid"], ice)

    {:noreply, state}
  end

  def handle_cast({:exrtc_audio, id, rid, packet}, state) do
    sender = state.players[id]

    if sender["id"] == 4 do
      state.players
      |> Enum.reject(fn {_, player} ->
        player["id"] == sender["id"] || is_nil(player["rtc_pid"])
      end)
      |> Enum.each(fn {_id, receiver} ->
        track_id =
          if is_nil(rid), do: sender["rtc_tracks"].audio.id, else: sender["rtc_tracks"].video.id

        if not is_nil(rid), do: IO.inspect("Sending #{rid}")

        ExWebRTC.PeerConnection.send_rtp(
          receiver["rtc_pid"],
          track_id,
          packet
        )
      end)
    end

    {:noreply, state}
  end

  def handle_cast({:exrtc_send_pli, id, packets}, state) do
    sender = state.players[id]
    video_track = sender["rtc_tracks"][:video]

    for packet <- packets do
      case packet do
        {_track_id, %ExRTCP.Packet.PayloadFeedback.PLI{}} when video_track.id != nil ->
          :ok = ExWebRTC.PeerConnection.send_pli(sender["rtc_pid"], video_track.id, "h")

        _other ->
          # do something with other RTCP packets
          :ok
      end
    end

    {:noreply, state}
  end

  defp init_player_state(player, socket_pid) do
    %{
      "id" => player.id,
      "username" => player.username,
      "x" => 4,
      "y" => 16,
      "dir_x" => "left",
      "dir_y" => "down",
      "state" => "idle",
      "socket_pid" => socket_pid,
      "audio_enabled" => false
    }
  end
end
