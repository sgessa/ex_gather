defmodule ExGather.Room.Handler do
  alias ExGather.Room.Player
  alias ExGather.Room.RTC

  alias ExGatherWeb.Packets

  #
  # Retain new player in room
  #

  def retain(player_attrs, {socket_pid, _ref}) do
    {:ok, Player.new(player_attrs, socket_pid)}
  end

  #
  # Release player from room
  #

  def release(%Player{rtc_pid: rtc_pid} = player, state) when not is_nil(rtc_pid) do
    state.players
    |> Enum.reject(fn {_id, receiver} ->
      is_nil(receiver.rtc_pid)
    end)
    |> Enum.each(fn {_id, receiver} ->
      RTC.detach_tracks_from_peer(receiver.rtc_pid, player.rtc_tracks)
    end)

    :ok
  end

  def release(_player, _state), do: :ok

  #
  # Handle WebRTC negotiation
  #

  def handle_rtc_offer(%Player{} = sender, rtc_pid, offer, players) do
    RTC.close_peer(sender.rtc_pid)

    # Assign new peer to player's state
    sender =
      sender
      |> Map.put(:rtc_ready, false)
      |> Map.put(:rtc_pid, rtc_pid)

    # Attach existing tracks to new peer
    # Ask old peers to renegotiate new peer's tracks
    players =
      players
      |> Enum.reject(fn {id, _player} -> id == sender.id end)
      |> Enum.map(fn {id, receiver} ->
        # Attach existing tracks to sender
        RTC.attach_tracks_to_peer(sender.rtc_pid, receiver.rtc_tracks)

        # Attack new track to existing players & ask them to renegotiate
        # Prevent renegotiation loop
        if RTC.find_output_tracks(receiver.rtc_pid, sender.rtc_tracks) do
          {id, receiver}
        else
          send(receiver.socket_pid, {:push, "exrtc_renegotiate", ""})
          {id, %{receiver | rtc_ready: false}}
        end
      end)
      |> Map.new()
      |> Map.put(sender.id, sender)

    # Continue sender negotiation
    {:ok, answer} = RTC.handle_offer(sender.rtc_pid, offer)
    packet = Packets.WebrtcAnswer.build(answer)
    send(sender.socket_pid, {:push, "exrtc_answer", packet})

    {:ok, players}
  end

  #
  # Handle WebRTC ice candidate
  #

  def handle_rtc_ice(%Player{} = player, ice_candidate),
    do: RTC.handle_ice(player.rtc_pid, ice_candidate)

  #
  # Handle WebRTC stream packet
  #

  def handle_rtc_send_rtp(%Player{} = sender, client_track_id, packet, players) do
    server_track_id =
      sender.rtc_pid
      |> RTC.find_input_track(client_track_id)
      |> case do
        %{kind: :video} -> sender.rtc_tracks.video.id
        %{kind: :audio} -> sender.rtc_tracks.audio.id
      end

    players
    |> Enum.reject(fn {_, receiver} ->
      receiver.id == sender.id || !Player.rtc_ready?(receiver)
    end)
    |> Enum.map(fn {_, receiver} -> receiver.rtc_pid end)
    |> RTC.forward_rtp(server_track_id, packet)

    :ok
  end

  #
  # Handle Chat Message
  #

  @whisper 2
  def handle_chat(%Player{} = sender, %Player{} = dest, @whisper, msg) do
    packet = Packets.ChatMsg.build(sender.id, @whisper, msg)
    send(dest.socket_pid, {:push, "player_chat", packet})
    :ok
  end

  def handle_chat(%Player{} = sender, _dest, type, msg) do
    packet = Packets.ChatMsg.build(sender.id, type, msg)
    send(sender.socket_pid, {:broadcast, "player_chat", packet})

    :ok
  end
end
