defmodule ExGatherWeb.PageHTML do
  use ExGatherWeb, :html

  import ExGatherWeb.ChatComponents

  embed_templates "page_html/*"
end
