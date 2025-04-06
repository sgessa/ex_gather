defmodule ExGather.Room.Server do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %{players: %{}}}
  end

  def handle_call({:join, player, rtc}, _from, state) do
    player = Map.merge(player, %{x: 0, y: 0, dir: 0, state: "idle", rtc: rtc})
    players = Map.put(state.players, player.id, player)

    # Enum.each(state.players, fn {_id, p} ->
    #   ExWebRTC.PeerConnection.add_track(p.rtc.pid, player.rtc.track)
    # end)

    {:reply, {:ok, player, state.players}, %{state | players: players}}
  end

  def handle_call({:leave, player}, _from, state) do
    players = Map.delete(state.players, player.id)
    {:reply, :ok, %{state | players: players}}
  end

  def handle_cast({:update_player, id, attrs}, state) do
    player = Map.get(state.players, id) |> Map.merge(attrs)
    players = Map.put(state.players, id, player)
    {:noreply, %{state | players: players}}
  end

  def handle_cast({:rtc, from, packet}, state) do
    state.players
    |> Enum.reject(fn {_, p} -> p.rtc.pid == from.pid end)
    |> Enum.each(fn {_id, p} ->
      #ExWebRTC.PeerConnection.add_track(p.rtc.pid, from.track)

      ExWebRTC.PeerConnection.send_rtp(
        p.rtc.pid,
        p.rtc.track.id,
        packet
      )
    end)

    {:noreply, state}
  end
end
