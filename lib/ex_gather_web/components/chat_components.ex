defmodule ExGatherWeb.ChatComponents do
  use Phoenix.Component

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
    <div
      id="avatar-sidebar"
      class="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 space-y-3 overflow-y-auto sm:w-16"
    >
      <!-- Avatar List -->
      <div class="flex flex-col space-y-2">
        <!-- Example Avatar -->
        <div class="relative">
          <img
            src="https://via.placeholder.com/40"
            alt="User Avatar"
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500"
            title="User 1"
          />
          <span class="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800">
          </span>
        </div>
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
