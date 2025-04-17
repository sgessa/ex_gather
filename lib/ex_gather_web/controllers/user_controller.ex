defmodule ExGatherWeb.UserController do
  use ExGatherWeb, :controller

  alias ExGather.Users

  def new(conn, _params) do
    render(conn, :new, changeset: Users.change_user())
  end

  def create(conn, %{"user" => user_params}) do
    case Users.create_user(user_params) do
      {:ok, _user} ->
        conn
        |> put_flash(:info, "Account registered successfully")
        |> redirect(to: ~p"/users/login")

      {:error, changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def edit(conn, _params) do
    user = conn.assigns.current_user
    render(conn, :edit, changeset: Users.change_user(user))
  end

  def update(conn, %{"user" => user_params}) do
    user = conn.assigns.current_user

    case Users.update_user(user, user_params) do
      {:ok, _user} ->
        conn
        |> put_flash(:info, "Profile updated successfully")
        |> redirect(to: ~p"/users/settings")

      {:error, changeset} ->
        render(conn, :edit, changeset: changeset)
    end
  end
end
