defmodule ExGatherWeb.PageHTML do
  @moduledoc """
  This module contains pages rendered by PageController.

  See the `page_html` directory for all templates available.
  """
  use ExGatherWeb, :html

  embed_templates "page_html/*"
end
