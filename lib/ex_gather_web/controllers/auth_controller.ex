defmodule ExGatherWeb.AuthController do
  use ExGatherWeb, :controller

  alias ExGather.Users

  def new(conn, _params) do
    render(conn, :new)
  end

  def create(conn, %{"user" => auth_params}) do
    case Users.sign_in_user(auth_params) do
      {:ok, user, token} ->
        conn
        |> put_session(:user_id, user.id)
        |> put_session(:token, token)
        |> redirect(to: ~p"/")

      _error ->
        conn
        |> put_flash(:error, "Invalid username or password")
        |> redirect(to: ~p"/users/login")
    end
  end

  def delete(conn, _params) do
    conn
    |> delete_session(:user_id)
    |> delete_session(:token)
    |> redirect(to: ~p"/users/login")
  end
end
