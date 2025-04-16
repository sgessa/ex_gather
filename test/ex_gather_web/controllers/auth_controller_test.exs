defmodule ExGatherWeb.AuthControllerTest do
  use ExGatherWeb.ConnCase

  setup do
    %{conn: build_conn()}
  end

  describe "new" do
    test "ok", %{conn: conn} do
      conn = get(conn, ~p"/users/login")
      assert html_response(conn, 200)
    end

    test "error - already logged in" do
      conn = log_in_user() |> get(~p"/users/login")
      assert redirected_to(conn) == ~p"/"
    end
  end

  describe "create" do
    test "ok", %{conn: conn} do
      user = insert(:user)

      conn =
        post(conn, ~p"/users/login", %{
          "user" => %{"email" => user.email, "password" => "Password123"}
        })

      assert redirected_to(conn) == ~p"/"
      assert get_session(conn, :user_id) == user.id
    end

    test "error", %{conn: conn} do
      conn =
        post(conn, ~p"/users/login", %{
          "user" => %{"email" => "test@test.com", "password" => "Invalid"}
        })

      assert redirected_to(conn) == ~p"/users/login"
    end
  end

  describe "delete" do
    setup do
      %{conn: log_in_user()}
    end

    test "ok", %{conn: conn} do
      conn = delete(conn, ~p"/users/logout")
      assert redirected_to(conn) == ~p"/users/login"
    end
  end
end
