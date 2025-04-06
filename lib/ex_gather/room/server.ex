defmodule ExGather.Room.Server do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %{players: %{}}}
  end

  def handle_call({:join, player}, _from, state) do
    player = Map.merge(player, %{x: 0, y: 0, dir: 0, state: "idle"})
    players = Map.put(state.players, player.id, player)
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
end
