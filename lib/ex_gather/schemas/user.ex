defmodule ExGather.Schemas.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :username, :string
    field :hashed_password, :string, redact: true

    field :password, :string, virtual: true, redact: true
    field :current_password, :string, virtual: true, redact: true
    field :repeat_password, :string, virtual: true, redact: true

    timestamps(type: :utc_datetime)
  end

  def create_changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :email, :password])
    |> validate_required([:username, :email, :password])
    |> validate_email()
    |> validate_password()
    |> validate_username()
  end

  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :password, :current_password, :repeat_password])
    |> validate_required([:username])
    |> maybe_validate_change_password()
    |> validate_username()
  end

  defp validate_username(changeset) do
    changeset
    |> validate_length(:username, min: 4, max: 10)
    |> unsafe_validate_unique(:username, ExGather.Repo)
    |> unique_constraint(:username)
    |> validate_format(:username, ~r/^[a-zA-Z0-9]+$/,
      message: "must contain only letters and digits"
    )
  end

  defp validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, ExGather.Repo)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    if password = get_change(changeset, :password) do
      changeset
      |> validate_length(:password, min: 4, max: 72, count: :bytes)
      |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
      |> delete_change(:current_password)
      |> delete_change(:repeat_password)
    else
      changeset
    end
  end

  defp maybe_validate_change_password(changeset) do
    if get_change(changeset, :password) do
      changeset
      |> validate_required([:password, :current_password, :repeat_password])
      |> validate_current_password()
      |> validate_repeat_password()
      |> validate_password()
    else
      changeset
    end
  end

  defp validate_current_password(changeset) do
    current_password = get_change(changeset, :current_password)
    hashed_password = get_field(changeset, :hashed_password)

    with false <- is_nil(current_password) || is_nil(hashed_password),
         false <- Bcrypt.verify_pass(current_password, hashed_password) do
      add_error(changeset, :current_password, "is invalid")
    else
      _ -> changeset
    end
  end

  defp validate_repeat_password(changeset) do
    password = get_change(changeset, :password)
    repeat_password = get_change(changeset, :repeat_password)

    with false <- is_nil(password) || is_nil(repeat_password),
         false <- password == repeat_password do
      add_error(changeset, :repeat_password, "does not match")
    else
      _ -> changeset
    end
  end
end
