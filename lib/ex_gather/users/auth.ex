defmodule ExGather.Users.Auth do
  alias ExGather.Schemas.User
  alias ExGather.Users
  alias ExGather.Repo

  def authenticate!(id) when is_integer(id),
    do: {:ok, Users.get_user!(id)}

  def authenticate!(_id), do: {:error, :unauthenticated}

  def sign_in(%{"email" => email, "password" => password}) do
    with %User{} = user <- Repo.get_by(User, %{email: email}),
         true <- validate_password(user, password) do
      {:ok, user, "abcd"}
    else
      _ -> {:error, :invalid_login}
    end
  end

  defp validate_password(user, password),
    do: Bcrypt.verify_pass(password, user.hashed_password)
end
