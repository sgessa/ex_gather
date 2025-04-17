defmodule ExGatherWeb.UserControllerTest do
  use ExGatherWeb.ConnCase

  setup do
    %{conn: build_conn()}
  end

  @create_params %{
    "user" => %{
      "username" => "test",
      "password" => "Password123",
      "email" => "email@email.com"
    }
  }

  @update_params %{
    "user" => %{
      "username" => "username2"
    }
  }

  @invalid_params %{
    "user" => %{
      "username" => ""
    }
  }

  describe "new" do
    test "renders 200", %{conn: conn} do
      conn = get(conn, ~p"/users/signup")
      assert html_response(conn, 200)
    end
  end

  describe "create" do
    test "ok - redirects to login", %{conn: conn} do
      conn = post(conn, ~p"/users/signup", @create_params)
      assert redirected_to(conn) == ~p"/users/login"
    end

    test "error - renders new", %{conn: conn} do
      conn = post(conn, ~p"/users/signup", @invalid_params)
      assert html_response(conn, 200) =~ "Oops"
    end
  end

  describe "edit" do
    setup do
      %{conn: log_in_user()}
    end

    test "renders 200", %{conn: conn} do
      conn = get(conn, ~p"/users/settings")
      assert html_response(conn, 200)
    end
  end

  describe "update" do
    setup do
      %{conn: log_in_user()}
    end

    test "ok - redirects to settings", %{conn: conn} do
      conn = put(conn, ~p"/users/settings", @update_params)
      assert redirected_to(conn) == ~p"/users/settings"
    end

    test "error - renders settings", %{conn: conn} do
      conn = put(conn, ~p"/users/settings", @invalid_params)
      assert html_response(conn, 200) =~ "Oops"
    end
  end
end
