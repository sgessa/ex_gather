defmodule ExGather.Schemas.UserWorkspaces do
  use Ecto.Schema

  schema "user_workspaces" do
    belongs_to :workspace, ExGather.Schemas.Workspace
    belongs_to :user, ExGather.Schemas.User
  end
end
