defmodule ExGather.Users do
  alias ExGather.Schemas.User
  alias ExGather.Users.Context
  alias ExGather.Users.Auth

  #
  # Context
  #

  defdelegate create_user(params), to: Context, as: :create
  defdelegate update_user(user, params), to: Context, as: :update
  defdelegate change_user(user \\ %User{}, params \\ %{}), to: Context, as: :change
  defdelegate get_user!(id), to: Context, as: :get!

  #
  # Auth
  #

  defdelegate sign_in_user(params), to: Auth, as: :sign_in
  defdelegate authenticate_user!(token), to: Auth, as: :authenticate!
end
