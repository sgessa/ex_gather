defmodule ExGather.Room.Player do
  @dir_x %{
    left: 0,
    right: 1
  }

  @dir_y %{
    up: 2,
    down: 3
  }

  @state %{
    idle: 0,
    walk: 1
  }

  defstruct id: nil,
            username: nil,
            x: 4,
            y: 16,
            dir_x: @dir_x.left,
            dir_y: @dir_y.down,
            state: @state.idle,
            socket_pid: nil,
            rtc_pid: nil,
            rtc_ready: false,
            rtc_audio_enabled: false,
            rtc_camera_enabled: false,
            rtc_tracks: %{}

  def new(attrs, {socket_pid, _ref}) do
    {:ok, tracks} = ExGather.Room.RTC.create_stream_tracks()

    attrs =
      attrs
      |> Map.put(:socket_pid, socket_pid)
      |> Map.put(:rtc_tracks, tracks)

    struct(__MODULE__, attrs)
  end

  def rtc_alive?(%{rtc_pid: rtc_pid} = _player),
    do: rtc_pid && Process.alive?(rtc_pid)

  def rtc_ready?(player),
    do: not is_nil(player.rtc_pid) && player.rtc_ready == true
end
