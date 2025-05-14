defmodule ExGather.Users do
  alias ExGather.Schemas.User
  alias ExGather.Schemas.Workspace

  alias ExGather.Users.Context
  alias ExGather.Users.Auth
  alias ExGather.Users.Workspaces

  #
  # Context
  #

  defdelegate create_user(params), to: Context, as: :create
  defdelegate update_user(user, params), to: Context, as: :update
  defdelegate change_user(user \\ %User{}, params \\ %{}), to: Context, as: :change
  defdelegate get_user!(id), to: Context, as: :get!

  #
  # Workspaces
  #

  defdelegate get_workspace(user, id), to: Workspaces, as: :get
  defdelegate create_workspace(user, attrs), to: Workspaces, as: :create

  defdelegate change_workspace(workspace \\ %Workspace{}, attrs \\ %{}),
    to: Workspaces,
    as: :change

  defdelegate update_workspace(workspace, attrs),
    to: Workspaces,
    as: :update

  defdelegate join_workspace(user, workspace), to: Workspaces, as: :join

  #
  # Auth
  #

  defdelegate sign_in_user(params), to: Auth, as: :sign_in
  defdelegate authenticate_user!(token), to: Auth, as: :authenticate!
end
