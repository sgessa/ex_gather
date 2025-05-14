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
    ExGather.Factory.insert(:user_workspaces, %{user_id: user.id, workspace_id: 1})

    {:ok, _user, token} =
      ExGather.Users.sign_in_user(%{"email" => user.email, "password" => "Password123"})

    Phoenix.ConnTest.build_conn()
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:user_id, user.id)
    |> Plug.Conn.put_session(:token, token)
  end

  def log_in_user(user) do
    {:ok, _user, token} =
      ExGather.Users.sign_in_user(%{"email" => user.email, "password" => "Password123"})

    Phoenix.ConnTest.build_conn()
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:user_id, user.id)
    |> Plug.Conn.put_session(:token, token)
  end
end
