defmodule ExGatherWeb.Plugs.RequireUser do
  import Plug.Conn

  alias ExGather.Users

  use ExGatherWeb, :verified_routes

  def init(config), do: config

  def call(conn, _args) do
    with token <- get_session(conn, :token),
         {:ok, user} <- Users.authenticate_user!(token) do
      conn
      |> assign(:current_user, user)
    else
      _ ->
        conn
        |> delete_session(:token)
        |> delete_session(:user_id)
        |> Phoenix.Controller.redirect(to: ~p"/users/login")
        |> halt()
    end
  end
end
