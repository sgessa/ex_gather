defmodule ExGather.Schemas.Workspace do
  use Ecto.Schema
  import Ecto.Changeset

  schema "workspaces" do
    field :uid, :string
    field :name, :string

    timestamps(type: :utc_datetime)
  end

  @attrs [:uid, :name]
  @req @attrs

  def changeset(workspace, attrs) do
    workspace
    |> cast(attrs, @attrs)
    |> validate_required(@req)
    |> validate_format(:uid, ~r/^[a-zA-Z]+$/, message: "must contain only letters (a-z, A-Z)")
    |> upcase_uid()
  end

  defp upcase_uid(%{changes: %{uid: uid}} = cs),
    do: put_change(cs, :uid, String.upcase(uid))

  defp upcase_uid(cs), do: cs
end
