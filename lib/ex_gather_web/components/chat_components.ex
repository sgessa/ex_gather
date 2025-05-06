defmodule ExGatherWeb.ChatComponents do
  use Phoenix.Component

  import ExGatherWeb.CoreComponents, only: [icon: 1]

  def chat_header(assigns) do
    ~H"""
    <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h2 class="text-lg font-semibold">Chat</h2>
      <button class="text-gray-300 hover:text-white" id="chat-close-btn">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    """
  end

  def chat_dm_sidebar(assigns) do
    ~H"""
    <div class="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 space-y-3 overflow-y-auto sm:w-16">
      <div class="flex flex-col space-y-2" id="chat-dest-container">
        <a class="relative chat-dm" data-dest="-1">
          <div class="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 chat-dest-active">
            <.icon name="hero-megaphone" />
          </div>
        </a>
      </div>
    </div>
    """
  end

  def chat_messages_container(assigns) do
    ~H"""
    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900" id="chat-container"></div>
    """
  end

  def chat_input_container(assigns) do
    ~H"""
    <div class="p-4 bg-gray-800">
      <div class="flex space-x-2">
        <!-- Message Type Selector -->
        <select
          id="chat-type"
          class="p-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">Say</option>
          <option value="1">Megaphone</option>
        </select>

        <input
          id="chat-input"
          type="text"
          placeholder="Type..."
          class="flex-1 p-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
        />
        <button class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700" id="chat-send-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
    """
  end
end
