defmodule ExGather.TestHelper do
  alias ExGather.Repo

  # def update!(model, attrs) do
  #   model
  #   |> Repo.reload()
  #   |> Ecto.Changeset.change(attrs)
  #   |> Repo.update!()
  # end

  def get_error!(changeset, key) do
    changeset.errors
    |> Enum.find(&(elem(&1, 0) == key))
    |> elem(1)
    |> elem(0)
  end

  def count(query), do: Repo.aggregate(query, :count, :id)

  defmacro assert_difference(count_fn, delta, run_fn) do
    quote do
      value1 = unquote(count_fn)
      unquote(run_fn).()
      value2 = unquote(count_fn)

      assert value2 == value1 + unquote(delta),
             "expected count to change by #{unquote(delta)} but changed by #{value2 - value1}"
    end
  end

  defmacro assert_no_difference(count_fn, run_fn) do
    quote do
      assert_difference(unquote(count_fn), 0, unquote(run_fn))
    end
  end
end
