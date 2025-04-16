defmodule ExGather.Users.AuthTest do
  use ExGather.DataCase
  alias ExGather.Users

  describe "authenticate" do
    test "ok" do
      user = insert(:user)

      assert {:ok, authenticated} = Users.authenticate_user!(user.id)
      assert user.id == authenticated.id
    end

    test "error" do
      assert {:error, :unauthenticated} = Users.authenticate_user!(nil)
    end
  end

  describe "sign_in" do
    setup do
      %{user: insert(:user, email: "email@email.com")}
    end

    test "ok", %{user: user} do
      assert {:ok, authenticated, "abcd"} =
               Users.sign_in_user(%{"email" => "email@email.com", "password" => "Password123"})

      assert user.id == authenticated.id
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
