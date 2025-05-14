defmodule ExGatherWeb.PageControllerTest do
  use ExGatherWeb.ConnCase

  describe "page" do
    test "ok" do
      conn = log_in_user() |> get(~p"/")
      assert html_response(conn, 200)
    end

    test "redirects - no workspace" do
      user = insert(:user)
      conn = log_in_user(user) |> get(~p"/")
      assert redirected_to(conn) == ~p"/workspaces"
    end

    test "error - unauthenticated" do
      conn = build_conn() |> get(~p"/")
      assert redirected_to(conn) == ~p"/users/login"
    end
  end
end
