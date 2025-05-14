defmodule ExGatherWeb.WorkspaceControllerTest do
  use ExGatherWeb.ConnCase

  setup do
    %{conn: log_in_user()}
  end

  describe "index" do
    test "ok", %{conn: conn} do
      conn = conn |> get(~p"/workspaces")
      assert html_response(conn, 200) =~ "Workspaces"
    end
  end

  describe "new" do
    test "ok", %{conn: conn} do
      conn = conn |> get(~p"/workspaces/new")
      assert html_response(conn, 200) =~ "Create a new workspace"
    end
  end

  describe "create" do
    test "ok", %{conn: conn} do
      conn = conn |> post(~p"/workspaces", %{workspace: %{name: "Name", uid: "CRUID"}})
      assert redirected_to(conn) == ~p"/workspaces"
    end

    test "error", %{conn: conn} do
      conn = conn |> post(~p"/workspaces", %{workspace: %{name: ""}})
      assert html_response(conn, 200) =~ "Create a new workspace"
    end
  end

  describe "edit" do
    test "ok", %{conn: conn} do
      conn = conn |> get(~p"/workspaces/1/edit")
      assert html_response(conn, 200) =~ "Edit your workspace"
    end
  end

  describe "update" do
    test "ok", %{conn: conn} do
      conn = conn |> put(~p"/workspaces/1", %{workspace: %{name: "Name"}})
      assert redirected_to(conn) == ~p"/workspaces"
    end

    test "error", %{conn: conn} do
      conn = conn |> put(~p"/workspaces/1", %{workspace: %{name: ""}})
      assert html_response(conn, 200) =~ "Edit your workspace"
    end
  end

  describe "switch" do
    test "ok", %{conn: conn} do
      conn = conn |> get(~p"/workspaces/1/switch")
      assert get_session(conn, :workspace_id) == "1"
      assert redirected_to(conn) == ~p"/"
    end
  end
end
