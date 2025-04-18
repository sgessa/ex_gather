defmodule ExGather.Room.PlayerState do
  @directions %{
    left: 0,
    right: 1,
    up: 2,
    down: 3
  }

  @states %{
    idle: 0,
    walk: 1
  }

  def directions, do: @directions
  def states, do: @states
end
