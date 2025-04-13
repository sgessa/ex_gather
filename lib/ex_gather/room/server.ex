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
    {:ok, tracks} = RTC.create_stream_tracks()

    player = init_player_state(player, from_pid) |> Map.put("rtc_tracks", tracks)
    players = Map.put(state.players, player["id"], player)

    {:reply, {:ok, player, state.players}, %{state | players: players}}
  end

  def handle_call({:leave, player_id}, _from, state) do
    players = Map.delete(state.players, player_id)
    {:reply, :ok, %{state | players: players}}
  end

  def handle_call({:exrtc_start, player_id, rtc_pid}, _from, state) do
    player =
      state.players[player_id]
      |> Map.put("rtc_pid", rtc_pid)

    {:reply, :ok, put_in(state.players[player_id], player)}
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
    # if old_pid = state.players[id]["rtc_pid"] do
    #   ExWebRTC.PeerConnection.close(old_pid)
    # end

    sender = state.players[id] |> Map.put("rtc_ready", false) |> Map.put("rtc_pid", rtc_pid)

    IO.inspect("Handling #{sender["username"]} NEW OFFER (NEW PID)")
    IO.inspect(sender["rtc_tracks"], label: "#{sender["username"]} tracks")

    state.players
    |> Enum.reject(fn {id, _player} -> id == sender["id"] end)
    |> Enum.each(fn {_id, receiver} ->
      # Attach existing tracks to sender
      IO.inspect("Adding #{receiver["username"]} tracks to #{sender["username"]}")
      RTC.attach_tracks_to_peer(sender["rtc_pid"], receiver["rtc_tracks"])

      # Attack new track to existing players & ask them to renegotiate
      # Prevent renegotiation loop
      if not RTC.find_output_tracks(receiver["rtc_pid"], sender["rtc_tracks"]) do
        # RTC.attach_tracks_to_peer(receiver["rtc_pid"], sender["rtc_tracks"])
        IO.inspect("Sending #{receiver["username"]} tracks to #{sender["username"]}")
        send(receiver["socket_pid"], {:push, "exrtc_renegotiate", %{}})
      else
        IO.inspect("!!!!!!!!!!!!!!!!!!!! skipping #{receiver["username"]} ALREADY HAD TRACK")
      end
    end)

    IO.inspect(ExWebRTC.PeerConnection.get_transceivers(sender["rtc_pid"]),
      label: "Transceivers for #{sender["username"]}"
    )

    IO.inspect("Done #{sender["username"]} handling")
    IO.inspect("--------------------------------------------------ç")

    # Continue sender negotiation
    {:ok, answer} = RTC.handle_offer(sender["rtc_pid"], offer)

    IO.inspect(answer)

    send(sender["socket_pid"], {:push, "exrtc_answer", %{"answer" => answer}})

    {:noreply, put_in(state.players[id], sender)}
  end

  def handle_cast({:exrtc_ice, id, ice}, state) do
    player = state.players[id]
    state = put_in(state.players[id]["rtc_ready"], true)

    if state.players[id]["rtc_pid"] && Process.alive?(state.players[id]["rtc_pid"]) do
      RTC.handle_ice(player["rtc_pid"], ice)
    end

    {:noreply, state}
  end

  def handle_cast({:exrtc_audio, id, client_track_id, packet}, state) do
    sender = state.players[id]

    track_id =
      sender["rtc_pid"]
      |> RTC.find_input_track(client_track_id)
      |> case do
        %{kind: :video} -> sender["rtc_tracks"].video.id
        %{kind: :audio} -> sender["rtc_tracks"].audio.id
      end

    state.players
    |> Enum.reject(fn {_, player} ->
      player["id"] == sender["id"] || is_nil(player["rtc_pid"])
    end)
    |> Enum.reject(fn {_, player} ->
      player["rtc_ready"] != true
    end)
    |> Enum.each(fn {_id, receiver} ->
      ExWebRTC.PeerConnection.send_rtp(
        receiver["rtc_pid"],
        track_id,
        packet
      )
    end)

    {:noreply, state}
  end

  def handle_cast({:exrtc_send_pli, id, packets}, state) do
    sender = state.players[id]
    video_track = sender["rtc_tracks"][:video]

    for packet <- packets do
      case packet do
        {_track_id, %ExRTCP.Packet.PayloadFeedback.PLI{}} when video_track.id != nil ->
          state.players
          |> Enum.reject(fn {id, _player} -> id == sender["id"] end)
          |> Enum.each(fn {_id, player} ->
            :ok = ExWebRTC.PeerConnection.send_pli(player["rtc_pid"], video_track.id, "h")
          end)

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
      "audio_enabled" => false,
      "rtc_ready" => false
    }
  end
end
