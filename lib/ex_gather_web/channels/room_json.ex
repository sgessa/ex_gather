defmodule ExGatherWeb.RoomJSON do
  def room_state(players, player) do
    %{
      players: players(players),
      player: player(player)
    }
  end

  def players(players) do
    for {_, p} <- players, do: player(p)
  end

  def player(player),
    do: Map.take(player, [:id, :x, :y, :dir, :state, :username])
end
