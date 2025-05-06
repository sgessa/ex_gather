Mimic.copy(Kernel)
Mimic.copy(ExGather.Room.RTC)
Mimic.copy(ExGather.Room.Server)
Mimic.copy(ExWebRTC.PeerConnection)

{:ok, _} = Application.ensure_all_started(:ex_machina)
ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(ExGather.Repo, :manual)
