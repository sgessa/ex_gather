defmodule ExGather.Room.Player do
  alias ExGather.Room.Player

  defstruct id: nil,
            username: nil,
            x: 4,
            y: 16,
            dir_x: Player.State.directions().left,
            dir_y: Player.State.directions().down,
            state: Player.State.states().idle,
            socket_pid: nil,
            rtc_pid: nil,
            rtc_ready: false,
            rtc_audio_enabled: false,
            rtc_camera_enabled: false,
            rtc_tracks: %{}

  def new(attrs, socket_pid) do
    {:ok, tracks} = ExGather.Room.RTC.create_stream_tracks()

    attrs =
      attrs
      |> Map.put(:socket_pid, socket_pid)
      |> Map.put(:rtc_tracks, tracks)

    struct(__MODULE__, attrs)
  end

  def rtc_ready?(player) do
    !is_nil(player.rtc_pid) && player.rtc_ready
  end
end
