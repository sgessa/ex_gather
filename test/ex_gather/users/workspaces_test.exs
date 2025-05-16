defmodule ExGather.Users.WorkspacesTest do
  use ExGather.DataCase

  alias ExGather.Users
  alias ExGather.Schemas.Workspace

  alias ExGather.Repo

  setup do
    user = insert(:user)

    %{user: user}
  end

  describe "get" do
    test "ok", %{user: user} do
      insert(:user_workspaces, %{user_id: user.id, workspace_id: 1})
      user = Repo.preload(user, [:workspaces])

      assert %ExGather.Schemas.Workspace{id: 1, name: "Workspace", uid: "WORKSPACE"} =
               Users.get_workspace(user, 1)
    end
  end

  describe "create" do
    test "ok", %{user: user} do
      assert_difference(count(Workspace), 1, fn ->
        assert {:ok, workspace} =
                 Users.create_workspace(user, %{"name" => "Name", "uid" => "uid"})

        assert workspace.name == "Name"
        assert workspace.uid == "UID"

        user = Repo.reload(user) |> Repo.preload([:workspaces])
        assert [%Workspace{name: "Name", uid: "UID"}] = user.workspaces
      end)
    end

    test "error", %{user: user} do
      assert_no_difference(count(Workspace), fn ->
        assert {:error, _changeset} =
                 Users.create_workspace(user, %{"name" => "", "uid" => "uid"})

        user = Repo.reload(user) |> Repo.preload([:workspaces])
        assert user.workspaces == []
      end)
    end
  end

  describe "update" do
    test "ok" do
      workspace = insert(:workspace, %{name: "Test", uid: "TESTWRKSP"})
      assert {:ok, %{name: "Workspace"}} = Users.update_workspace(workspace, %{name: "Workspace"})
    end

    test "error" do
      workspace = insert(:workspace, %{name: "Test", uid: "TESTWRKSP"})
      {:error, _changeset} = Users.update_workspace(workspace, %{name: ""})
    end
  end

  describe "join" do
    test "ok", %{user: user} do
      workspace = insert(:workspace, %{name: "JOIN", uid: "JOIN"})
      assert {:ok, _join} = Users.join_workspace(user, workspace)

      user = Repo.reload(user) |> Repo.preload([:workspaces])
      assert [%Workspace{name: "JOIN"}] = user.workspaces
    end

    test "error - already joined", %{user: user} do
      workspace = insert(:workspace, %{name: "JOIN", uid: "JOIN"})
      assert {:ok, _join} = Users.join_workspace(user, workspace)

      assert {:error, _changeset} = Users.join_workspace(user, workspace)
    end
  end

  describe "invite" do
    test "ok" do
      workspace = insert(:workspace, %{name: "JOIN", uid: "JOIN"})

      assert {:ok, url} = Users.get_workspace_invite_url(workspace)

      assert url =~ "http://localhost:4000/workspaces/"
      assert url =~ "/join"
    end
  end

  describe "get_by_token" do
    test "ok" do
      workspace = insert(:workspace, %{name: "JOIN", uid: "JOIN"})
      assert {:ok, url} = Users.get_workspace_invite_url(workspace)

      # Extract token from url
      token =
        url
        |> String.replace("http://localhost:4000/workspaces/", "")
        |> String.replace("/join", "")

      assert {:ok, token_workspace} = Users.get_workspace_by_token(token)
      assert workspace.id == token_workspace.id
    end

    test "error" do
      assert {:error, :expired} = Users.get_workspace_by_token("invalid token")
    end
  end
end
