defmodule ExGather.Enum do
  defmacro __using__(values) do
    quote do
      use Ecto.Type

      # Ecto behaviour

      def type, do: :integer

      def load(data) when is_integer(data) do
        {:ok, cast!(data)}
      end

      def cast(key) when is_atom(key) do
        case Map.has_key?(unquote(values), key) do
          true ->
            {:ok, key}

          _ ->
            :error
        end
      end

      def dump(value) when is_atom(value) do
        {:ok, Map.get(unquote(values), value)}
      end

      # ExGather Enum

      def cast!(int) when is_integer(int) do
        case Enum.find(unquote(values), &(elem(&1, 1) == int)) do
          nil ->
            raise "Invalid #{__MODULE__} key"

          {k, _v} ->
            k
        end
      end

      def dump!(value) when is_atom(value),
        do: Map.get(unquote(values), value)
    end
  end
end
