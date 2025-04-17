defmodule ExGatherWeb.PageController do
  use ExGatherWeb, :controller

  def home(conn, _params) do
    token = get_session(conn, :token)

    conn
    |> assign(:token, token)
    |> render(:home, layout: false)
  end
end
