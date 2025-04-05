defmodule ExGatherWeb.PageController do
  use ExGatherWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    data = Map.take(conn.assigns.current_user, [:id, :username])
    token = Phoenix.Token.sign(ExGatherWeb.Endpoint, "user", data)

    conn
    |> assign(:token, token)
    |> render(:home, layout: false)
  end
end
