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
      |> put_workspace(user)
    else
      _ ->
        conn
        |> delete_session(:token)
        |> delete_session(:user_id)
        |> put_session(:redirect_url, conn.request_path)
        |> Phoenix.Controller.redirect(to: ~p"/users/login")
        |> halt()
    end
  end

  defp put_workspace(conn, user) do
    workspace =
      cond do
        id = get_session(conn, :workspace_id) ->
          Enum.find(user.workspaces, &("#{&1.id}" == "#{id}"))

        workspace = List.first(user.workspaces) ->
          workspace

        true ->
          nil
      end

    workspace_id = if w = workspace, do: w.id, else: nil

    conn
    |> put_session(:workspace_id, workspace_id)
    |> assign(:current_workspace, workspace)
  end
end
