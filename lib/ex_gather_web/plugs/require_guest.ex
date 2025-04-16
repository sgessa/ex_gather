defmodule ExGatherWeb.Plugs.RequireGuest do
  import Plug.Conn

  use ExGatherWeb, :verified_routes

  def init(config), do: config

  def call(conn, _args) do
    case get_session(conn, :token) do
      nil ->
        conn

      _session ->
        conn
        |> Phoenix.Controller.redirect(to: ~p"/")
        |> halt()
    end
  end
end
