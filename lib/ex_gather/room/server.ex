defmodule ExGather.Room.Server do
  use GenServer

  alias ExGather.Room.RTC
  alias ExGather.Room.Player

  defstruct players: %{}

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %__MODULE__{}}
  end

  def handle_call({:join, %{id: id} = player}, from_pid, state) do
    player = Player.new(player, from_pid)
    state = put_in(state.players[id], player)

    {:reply, {:ok, player, state.players}, state}
  end

  def handle_call({:leave, player_id}, _from, state) do
    player = state.players[player_id]
    players = Map.delete(state.players, player_id)

    if player.rtc_pid do
      state.players
      |> Enum.reject(fn {_, receiver} ->
        receiver.id == player.id || is_nil(receiver.rtc_pid)
      end)
      |> Enum.each(fn {_id, receiver} ->
        ExWebRTC.PeerConnection.remove_track(receiver.rtc_pid, player.rtc_tracks.video.id)
        ExWebRTC.PeerConnection.remove_track(receiver.rtc_pid, player.rtc_tracks.audio.id)
      end)
    end

    {:reply, :ok, put_in(state.players, players)}
  end

  def handle_cast({:update_player, id, attrs}, state) do
    attrs = Useful.atomize_map_keys(attrs)
    player = Map.merge(state.players[id], attrs)

    {:noreply, put_in(state.players[id], player)}
  end

  def handle_cast({:exrtc_offer, id, rtc_pid, offer}, state) do
    if old_pid = state.players[id].rtc_pid do
      ExWebRTC.PeerConnection.close(old_pid)
      Process.exit(old_pid, :kill)
    end

    sender =
      state.players[id]
      |> Map.put(:rtc_ready, false)
      |> Map.put(:rtc_pid, rtc_pid)

    players =
      state.players
      |> Enum.reject(fn {id, _player} -> id == sender.id end)
      |> Enum.map(fn {id, receiver} ->
        # Attach existing tracks to sender
        RTC.attach_tracks_to_peer(sender.rtc_pid, receiver.rtc_tracks)

        # Attack new track to existing players & ask them to renegotiate
        # Prevent renegotiation loop
        unless RTC.find_output_tracks(receiver.rtc_pid, sender.rtc_tracks) do
          send(receiver.socket_pid, {:push, "exrtc_renegotiate", %{}})
          {id, %{receiver | rtc_ready: false}}
        else
          {id, receiver}
        end
      end)
      |> Map.new()
      |> Map.put(id, sender)

    # Continue sender negotiation
    {:ok, answer} = RTC.handle_offer(sender.rtc_pid, offer)
    send(sender.socket_pid, {:push, "exrtc_answer", %{"answer" => answer}})

    {:noreply, put_in(state.players, players)}
  end

  def handle_cast({:exrtc_ice, id, ice}, state) do
    player = state.players[id]

    if Player.rtc_alive?(player),
      do: RTC.handle_ice(player.rtc_pid, ice)

    {:noreply, state}
  end

  def handle_cast({:exrtc_send_rtp, id, client_track_id, packet}, state) do
    sender = state.players[id]

    server_track_id =
      sender.rtc_pid
      |> RTC.find_input_track(client_track_id)
      |> case do
        %{kind: :video} -> sender.rtc_tracks.video.id
        %{kind: :audio} -> sender.rtc_tracks.audio.id
      end

    state.players
    |> Enum.reject(fn {_, receiver} ->
      receiver.id == sender.id || not Player.rtc_ready?(receiver)
    end)
    |> Enum.map(fn {_, receiver} -> receiver.rtc_pid end)
    |> RTC.forward_rtp(server_track_id, packet)

    {:noreply, state}
  end
end
