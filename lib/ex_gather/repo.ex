defmodule ExGather.Repo do
  use Ecto.Repo,
    otp_app: :ex_gather,
    adapter: Ecto.Adapters.Postgres
end
