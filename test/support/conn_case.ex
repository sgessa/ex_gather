defmodule ExGatherWeb.ConnCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint ExGatherWeb.Endpoint

      use ExGatherWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import ExGatherWeb.ConnCase
      import ExGather.Factory
      import ExGather.TestHelper
    end
  end

  setup tags do
    ExGather.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  def log_in_user() do
    user = ExGather.Factory.insert(:user)

    Phoenix.ConnTest.build_conn()
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:user_id, user.id)
  end
end
