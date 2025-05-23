defmodule ExGather.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ExGatherWeb.Telemetry,
      ExGather.Repo,
      {Phoenix.PubSub, name: ExGather.PubSub},
      # Lobby GenServer
      {ExGather.Room.Server, name: :"room:lobby"},
      # Start to serve requests, typically the last entry
      ExGatherWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ExGather.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # coveralls-ignore-start
  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.

  @impl true

  def config_change(changed, _new, removed) do
    ExGatherWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  # coveralls-ignore-stop
end
