defmodule ExGatherWeb.Router do
  use ExGatherWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {ExGatherWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  #
  # Guest
  #

  pipeline :require_guest do
    plug ExGatherWeb.Plugs.RequireGuest
  end

  scope "/", ExGatherWeb do
    pipe_through [:browser, :require_guest]

    get "/users/signup", UserController, :new
    post "/users/signup", UserController, :create

    get "/users/login", AuthController, :new
    post "/users/login", AuthController, :create
  end

  #
  # Authenticated
  #

  pipeline :require_user do
    plug ExGatherWeb.Plugs.RequireUser
  end

  scope "/", ExGatherWeb do
    pipe_through [:browser, :require_user]

    get "/users/settings", UserController, :edit
    put "/users/settings", UserController, :update
    delete "/users/logout", AuthController, :delete

    get "/", PageController, :home
  end

  if Application.compile_env(:ex_gather, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: ExGatherWeb.Telemetry
    end
  end
end
