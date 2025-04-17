defmodule ExGather.Users.AuthTest do
  use ExGather.DataCase
  alias ExGather.Users

  setup do
    %{user: insert(:user, email: "email@email.com")}
  end

  describe "authenticate" do
    test "ok", %{user: user} do
      assert {:ok, _user, token} =
               Users.sign_in_user(%{"email" => "email@email.com", "password" => "Password123"})

      assert {:ok, authenticated} = Users.authenticate_user!(token)
      assert user.id == authenticated.id
    end

    test "error - wrong token" do
      assert {:error, :unauthenticated} = Users.authenticate_user!("wrong")
    end

    test "error - nil token" do
      assert {:error, :unauthenticated} = Users.authenticate_user!(nil)
    end
  end

  describe "sign_in" do
    test "ok", %{user: user} do
      assert {:ok, authenticated, token} =
               Users.sign_in_user(%{"email" => "email@email.com", "password" => "Password123"})

      assert user.id == authenticated.id
      assert token
    end

    test "error - invalid password" do
      assert {:error, :invalid_login} =
               Users.sign_in_user(%{"email" => "email@email.com", "password" => "WrongPassword"})
    end

    test "error - invalid email" do
      assert {:error, :invalid_login} =
               Users.sign_in_user(%{
                 "email" => "invalid@email.com",
                 "password" => "WrongPassword"
               })
    end
  end
end
