defmodule ExGatherWeb.RoomJSON do
  def room_state(players) do
    %{
      players: players(players)
    }
  end

  def players(players),
    do: for({_, p} <- players, do: player(p))

  def player(player) do
    player
    |> Map.take([
      :id,
      :x,
      :y,
      :dir_x,
      :dir_y,
      :state,
      :username,
      :rtc_audio_enabled,
      :rtc_camera_enabled
    ])
    |> Map.put(:rtc_tracks, rtc_tracks(player.rtc_tracks))
  end

  defp rtc_tracks(%{audio: audio, video: video}),
    do: %{audio_id: hd(audio.streams), video_id: hd(video.streams)}

  defp rtc_tracks(_tracks), do: nil
end
