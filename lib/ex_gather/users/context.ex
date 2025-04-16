defmodule ExGather.Users.Context do
  alias ExGather.Schemas.User
  alias ExGather.Repo

  def create(params) do
    %User{}
    |> User.create_changeset(params)
    |> Repo.insert()
  end

  def update(%User{} = user, params) do
    user
    |> User.update_changeset(params)
    |> Repo.update()
  end

  def change(user, params),
    do: user |> User.update_changeset(params)

  def get!(id),
    do: Repo.get!(User, id)
end
