defmodule ExGatherWeb.PageController do
  use ExGatherWeb, :controller

  def home(conn, _params) do
    token = get_session(conn, :token)

    case conn.assigns.current_workspace do
      nil ->
        conn
        |> put_flash(:info, "You haven't got any workspaces yet")
        |> redirect(to: ~p"/workspaces")

      _ ->
        conn
        |> assign(:token, token)
        |> render(:home, layout: false)
    end
  end
end
