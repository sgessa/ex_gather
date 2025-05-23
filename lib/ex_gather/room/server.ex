defmodule ExGather.Room.Server do
  use GenServer

  alias ExGather.Room.Handler

  defstruct players: %{}

  # coveralls-ignore-start

  def start_link(opts), do: GenServer.start_link(__MODULE__, [], opts)
  def call(pid, msg), do: GenServer.call(pid, msg)
  def cast(pid, msg), do: GenServer.cast(pid, msg)

  # coveralls-ignore-stop

  def init(_args) do
    {:ok, %__MODULE__{}}
  end

  def handle_call({:join, player}, from_pid, state) do
    {:ok, %{id: id} = player} = Handler.retain(player, from_pid)

    state = put_in(state.players[id], player)
    players = Map.values(state.players)
    {:reply, {:ok, player, players}, state}
  end

  def handle_call({:leave, player_id}, _from, state) do
    player = state.players[player_id]
    players = Map.delete(state.players, player_id)
    state = put_in(state.players, players)

    :ok = Handler.release(player, state)

    {:reply, :ok, state}
  end

  def handle_cast({:update_player, id, attrs}, state) do
    player = Map.merge(state.players[id], attrs)
    {:noreply, put_in(state.players[id], player)}
  end

  def handle_cast({:player_chat, id, rcpt_id, type, msg}, state) do
    sender = state.players[id]
    rcpt = state.players[rcpt_id]

    :ok = Handler.handle_chat(sender, rcpt, type, msg)

    {:noreply, state}
  end

  def handle_cast({:exrtc_offer, id, rtc_pid, offer}, state) do
    sender = state.players[id]

    {:ok, players} = Handler.handle_rtc_offer(sender, rtc_pid, offer, state.players)
    {:noreply, put_in(state.players, players)}
  end

  def handle_cast({:exrtc_ice, id, ice_candidate}, state) do
    player = state.players[id]
    :ok = Handler.handle_rtc_ice(player, ice_candidate)

    {:noreply, state}
  end

  def handle_cast({:exrtc_send_rtp, id, client_track_id, packet}, state) do
    sender = state.players[id]
    :ok = Handler.handle_rtc_send_rtp(sender, client_track_id, packet, state.players)

    {:noreply, state}
  end
end
