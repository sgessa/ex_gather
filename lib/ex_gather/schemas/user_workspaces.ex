defmodule ExGather.Schemas.UserWorkspaces do
  use Ecto.Schema

  import Ecto.Changeset

  schema "user_workspaces" do
    belongs_to :workspace, ExGather.Schemas.Workspace
    belongs_to :user, ExGather.Schemas.User
  end

  def changeset(uw, attrs) do
    uw
    |> cast(attrs, [:workspace_id, :user_id])
    |> validate_required([:workspace_id, :user_id])
    |> unique_constraint([:workspace_id, :user_id])
  end
end
