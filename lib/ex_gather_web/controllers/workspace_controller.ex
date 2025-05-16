defmodule ExGatherWeb.WorkspaceController do
  use ExGatherWeb, :controller

  alias ExGather.Users

  def index(conn, _params) do
    render(conn, :index)
  end

  def new(conn, _params) do
    render(conn, :new, changeset: Users.change_workspace())
  end

  def create(conn, %{"workspace" => workspace_params}) do
    case Users.create_workspace(conn.assigns.current_user, workspace_params) do
      {:ok, _workspace} ->
        conn
        |> put_flash(:info, "Workspace created successfully")
        |> redirect(to: ~p"/workspaces")

      {:error, changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def edit(conn, %{"id" => id}) do
    workspace = Users.get_workspace(conn.assigns.current_user, id)
    changeset = Users.change_workspace(workspace, %{})

    render(conn, :edit, changeset: changeset, workspace: workspace)
  end

  def update(conn, %{"id" => id, "workspace" => workspace_params}) do
    workspace = Users.get_workspace(conn.assigns.current_user, id)

    case Users.update_workspace(workspace, workspace_params) do
      {:ok, _workspace} ->
        conn
        |> put_flash(:info, "Workspace updated")
        |> redirect(to: ~p"/workspaces")

      {:error, changeset} ->
        render(conn, :edit, workspace: workspace, changeset: changeset)
    end
  end

  def invite(conn, %{"id" => id}) do
    workspace = Users.get_workspace(conn.assigns.current_user, id)
    {:ok, url} = Users.get_workspace_invite_url(workspace)

    render(conn, :index, invite_url: url)
  end

  def switch(conn, %{"id" => id}) do
    conn
    |> put_session(:workspace_id, id)
    |> redirect(to: ~p"/")
  end

  def join(conn, %{"token" => token}) do
    user = conn.assigns.current_user

    with {:ok, workspace} <- Users.get_workspace_by_token(token),
         {:ok, _join} <- Users.join_workspace(user, workspace) do
      conn
      |> put_flash(:info, "You've joined #{workspace.name} workspace")
      |> redirect(to: ~p"/workspaces")
    else
      _ ->
        conn
        |> put_flash(:error, "Workspace invite is expired")
        |> redirect(to: ~p"/workspaces")
    end
  end
end
