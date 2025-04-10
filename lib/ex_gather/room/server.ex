defmodule ExGather.Room.Server do
  use GenServer

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

  defp init_player_state(player, socket_pid) do
    %{
      "id" => player.id,
      "username" => player.username,
      "x" => 100,
      "y" => 100,
      "dir_x" => "left",
      "dir_y" => "down",
      "state" => "idle",
      "socket_pid" => socket_pid,
      "audio_enabled" => false
    }
  end
end
