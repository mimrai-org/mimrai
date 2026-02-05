import { create } from "zustand";

interface ChatState {
	// Input state
	input: string;
	setInput: (input: string) => void;
	clearInput: () => void;

	// Web search state
	isWebSearch: boolean;
	setIsWebSearch: (isWebSearch: boolean) => void;

	// Agent selection state
	selectedAgentId: string | null;
	setSelectedAgentId: (agentId: string | null) => void;

	// Upload state
	isUploading: boolean;
	setIsUploading: (isUploading: boolean) => void;

	// Recording state
	isRecording: boolean;
	isProcessing: boolean;
	setIsRecording: (isRecording: boolean) => void;
	setIsProcessing: (isProcessing: boolean) => void;

	// Command suggestions state
	showCommands: boolean;
	setShowCommands: (showCommands: boolean) => void;
	selectedCommandIndex: number;
	setSelectedCommandIndex: (index: number) => void;
	commandQuery: string;
	setCommandQuery: (query: string) => void;
	cursorPosition: number;
	setCursorPosition: (position: number) => void;

	// Actions
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	resetCommandState: () => void;
	navigateCommandUp: () => void;
	navigateCommandDown: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
	// Initial state
	input: "",
	isWebSearch: false,
	selectedAgentId: null,
	isUploading: false,
	isRecording: false,
	isProcessing: false,
	showCommands: false,
	selectedCommandIndex: 0,
	commandQuery: "",
	cursorPosition: 0,

	// Basic setters
	setInput: (input) => set({ input }),
	clearInput: () => set({ input: "", cursorPosition: 0 }),
	setIsWebSearch: (isWebSearch) => set({ isWebSearch }),
	setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
	setIsUploading: (isUploading) => set({ isUploading }),
	setIsRecording: (isRecording) => set({ isRecording }),
	setIsProcessing: (isProcessing) => set({ isProcessing }),
	setShowCommands: (showCommands) => set({ showCommands }),
	setSelectedCommandIndex: (selectedCommandIndex) =>
		set({ selectedCommandIndex }),
	setCommandQuery: (commandQuery) => set({ commandQuery }),
	setCursorPosition: (cursorPosition) => set({ cursorPosition }),

	// Input change handler
	handleInputChange: (e) => {
		const value = e.target.value;
		const cursorPos = e.target.selectionStart;

		set({ input: value, cursorPosition: cursorPos });

		set({
			showCommands: false,
			commandQuery: "",
		});
	},

	// Keyboard navigation handler
	handleKeyDown: (e) => {
		const { showCommands } = get();

		if (!showCommands) return;
	},

	// Utility functions
	resetCommandState: () => {
		set({
			showCommands: false,
			commandQuery: "",
			selectedCommandIndex: 0,
		});
	},

	navigateCommandUp: () => {},

	navigateCommandDown: () => {},

	selectCurrentCommand: () => {},
}));
