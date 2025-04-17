defmodule ExGather.Factory do
  use ExMachina.Ecto, repo: ExGather.Repo

  def user_factory do
    %ExGather.Schemas.User{
      username: sequence(:username, &"USER#{&1}"),
      email: sequence(:email, &"user#{&1}@example.com"),
      hashed_password: Bcrypt.hash_pwd_salt("Password123")
    }
  end
end
