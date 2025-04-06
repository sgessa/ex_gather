defmodule ExGather.Room.Server do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %{players: %{}}}
  end

  def handle_call({:join, player, rtc}, _from, state) do
    player = init_player_state(player, rtc)
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

  def handle_cast({:rtc, from, packet}, state) do
    state.players
    |> Enum.reject(fn {_, p} -> p["rtc"].pid == from.pid end)
    |> Enum.each(fn {_id, p} ->
      ExWebRTC.PeerConnection.send_rtp(
        p["rtc"].pid,
        p["rtc"].track.id,
        packet
      )
    end)

    {:noreply, state}
  end

  defp init_player_state(player, rtc) do
    %{
      "id" => player.id,
      "username" => player.username,
      "x" => 100,
      "y" => 100,
      "dir_x" => "left",
      "dir_y" => "down",
      "state" => "idle",
      "rtc" => rtc
    }
  end
end
