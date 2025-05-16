defmodule ExGather.Users.Workspaces do
  alias ExGather.Schemas.User
  alias ExGather.Schemas.Workspace
  alias ExGather.Schemas.UserWorkspaces

  alias ExGather.Repo

  @max_ttl 86_400

  def get(%User{} = user, id),
    do: Enum.find(user.workspaces, &("#{&1.id}" == "#{id}"))

  def get(id),
    do: Repo.get(Workspace, id)

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
    |> UserWorkspaces.changeset(%{user_id: user.id, workspace_id: workspace.id})
    |> Repo.insert()
  end

  def invite(%Workspace{} = workspace) do
    fernetex_key = Application.get_env(:ex_gather, :fernetex_key)
    full_domain = Application.get_env(:ex_gather, :full_domain)

    {:ok, _, token} =
      Fernet.generate("#{workspace.id}", key: fernetex_key)

    {:ok, "#{full_domain}/workspaces/#{token}/join"}
  end

  def get_by_token(token) do
    fernetex_key = Application.get_env(:ex_gather, :fernetex_key)

    with {:ok, id} <- Fernet.verify(token, ttl: @max_ttl, key: fernetex_key),
         %Workspace{} = workspace <- get(id) do
      {:ok, workspace}
    else
      _error -> {:error, :expired}
    end
  end
end
