defmodule ExGather.Room do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, [], opts)
  end

  def init(_args) do
    {:ok, %{players: %{}}}
  end

  def handle_call({:join, player}, _from, state) do
    players = Map.put(state.players, player.id, player)
    {:reply, {:ok, state.players}, %{state | players: players}}
  end

  def handle_call({:leave, player}, _from, state) do
    players = Map.delete(state.players, player.id)
    {:reply, :ok, %{state | players: players}}
  end

  def handle_cast({:update_player, player}, state) do
    players = Map.put(state.players, player.id, player)
    {:noreply, %{state | players: players}}
  end
end
