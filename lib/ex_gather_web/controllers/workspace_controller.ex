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

  def switch(conn, %{"id" => id}) do
    conn
    |> put_session(:workspace_id, id)
    |> redirect(to: ~p"/")
  end
end
