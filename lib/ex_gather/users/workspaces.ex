defmodule ExGather.Users.Workspaces do
  alias ExGather.Schemas.User
  alias ExGather.Schemas.Workspace
  alias ExGather.Schemas.UserWorkspaces

  alias ExGather.Repo

  def get(%User{} = user, id),
    do: Enum.find(user.workspaces, &("#{&1.id}" == "#{id}"))

  def change(workspace, attrs), do: Workspace.changeset(workspace, attrs)

  def create(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with changeset <- change(%Workspace{}, attrs),
           {:ok, workspace} <- Repo.insert(changeset),
           {:ok, _workspace_user} <- join(user, workspace) do
        workspace
      else
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  def update(workspace, attrs) do
    workspace
    |> change(attrs)
    |> Repo.update()
  end

  def join(%User{} = user, %Workspace{} = workspace) do
    %UserWorkspaces{}
    |> Ecto.Changeset.change(%{user_id: user.id, workspace_id: workspace.id})
    |> Repo.insert()
  end
end
