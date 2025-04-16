defmodule ExGather.Users.ContextTest do
  use ExGather.DataCase

  alias ExGather.Users
  alias ExGather.Schemas.User

  @create_params %{
    "username" => "test",
    "password" => "Password123",
    "email" => "email@email.com"
  }

  @update_params %{
    "username" => "Updated123"
  }

  @pass_params %{
    "username" => "test",
    "password" => "NewPassword456",
    "repeat_password" => "NewPassword456",
    "current_password" => "Password123"
  }

  describe "create" do
    test "ok" do
      assert_difference(count(User), 1, fn ->
        assert {:ok, user} = Users.create_user(@create_params)
        assert user.username == @create_params["username"]
        assert user.email == @create_params["email"]
      end)
    end

    test "error - username format" do
      assert_no_difference(count(User), fn ->
        assert {:error, changeset} = Users.create_user(%{"username" => "W!#"})
        assert get_error!(changeset, :username) == "must contain only letters and digits"
      end)
    end

    test "error - username uniqueness" do
      insert(:user, %{username: "test123"})

      assert_no_difference(count(User), fn ->
        assert {:error, changeset} = Users.create_user(%{"username" => "test123"})
        assert get_error!(changeset, :username) == "has already been taken"
      end)
    end

    test "error - email format" do
      assert_no_difference(count(User), fn ->
        assert {:error, changeset} =
                 Users.create_user(%{"username" => "test", "email" => "email"})

        assert get_error!(changeset, :email) == "must have the @ sign and no spaces"
      end)
    end
  end

  test "error - email uniqueness" do
    insert(:user, %{email: "test@test.com"})

    assert_no_difference(count(User), fn ->
      assert {:error, changeset} = Users.create_user(%{"email" => "test@test.com"})
      assert get_error!(changeset, :email) == "has already been taken"
    end)
  end

  describe "update" do
    setup do
      %{user: insert(:user)}
    end

    test "ok", %{user: user} do
      assert {:ok, updated} = Users.update_user(user, @update_params)
      assert updated.username == @update_params["username"]

      assert updated.hashed_password == user.hashed_password
    end

    test "ok - password", %{user: user} do
      assert {:ok, updated} = Users.update_user(user, @pass_params)
      assert updated.hashed_password != user.hashed_password
    end

    test "error - repeat_password does not match", %{user: user} do
      pass_params = Map.put(@pass_params, "repeat_password", "WrongRepeat")
      assert {:error, changeset} = Users.update_user(user, pass_params)
      assert get_error!(changeset, :repeat_password) == "does not match"
    end

    test "error - current_password is invalid", %{user: user} do
      pass_params = Map.put(@pass_params, "current_password", "WrongCurrent")
      assert {:error, changeset} = Users.update_user(user, pass_params)
      assert get_error!(changeset, :current_password) == "is invalid"
    end

    test "error - password is invalid", %{user: user} do
      pass_params = Map.put(@pass_params, "password", "a")
      assert {:error, changeset} = Users.update_user(user, pass_params)
      assert get_error!(changeset, :password) =~ "should be at least"
    end
  end
end
