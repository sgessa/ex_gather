defmodule ExGather.Repo.Migrations.CreateUserWorkspaces do
  use Ecto.Migration

  def change do
    create table(:user_workspaces) do
      add :workspace_id, references(:workspaces, on_delete: :delete_all)
      add :user_id, references(:users, on_delete: :delete_all)
    end

    create unique_index(:user_workspaces, [:workspace_id, :user_id])
  end
end
