defmodule ExGatherWeb.RoomJSON do
  def room_state(players) do
    %{
      players: players(players)
    }
  end

  def players(players) do
    for {_, p} <- players, do: player(p)
  end

  def player(player) do
    Map.take(player, ["id", "x", "y", "dir_x", "dir_y", "state", "username"])
  end
end
