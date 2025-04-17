defmodule ExGather.Users.Auth do
  alias ExGather.Schemas.User
  alias ExGather.Users
  alias ExGather.Repo

  def authenticate!(token) when is_binary(token) do
    case Phoenix.Token.verify(ExGatherWeb.Endpoint, "user", token, max_age: 300) do
      {:ok, user} ->
        {:ok, Users.get_user!(user.id)}

      _ ->
        {:error, :unauthenticated}
    end
  end

  def authenticate!(_token), do: {:error, :unauthenticated}

  def sign_in(%{"email" => email, "password" => password}) do
    with %User{} = user <- Repo.get_by(User, %{email: email}),
         true <- validate_password(user, password) do
      {:ok, user, user_token(user)}
    else
      _ -> {:error, :invalid_login}
    end
  end

  defp user_token(user) do
    data = Map.take(user, [:id, :username])
    Phoenix.Token.sign(ExGatherWeb.Endpoint, "user", data)
  end

  defp validate_password(user, password),
    do: Bcrypt.verify_pass(password, user.hashed_password)
end
