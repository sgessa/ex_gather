defmodule ExGatherWeb.Plugs.RequireUser do
  import Plug.Conn

  alias ExGather.Users

  use ExGatherWeb, :verified_routes

  def init(config), do: config

  def call(conn, _args) do
    with id <- get_session(conn, :user_id),
         {:ok, user} <- Users.authenticate_user!(id) do
      conn
      |> assign(:current_user, user)
    else
      _ ->
        conn
        |> Phoenix.Controller.redirect(to: ~p"/users/login")
        |> halt()
    end
  end
end
